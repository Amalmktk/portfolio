import { pool } from '../_lib/db.js';

// India time: a visit at 11:30 PM IST counts toward that day
const TZ = 'Asia/Kolkata';
// Rows for the IST day in $1, as a range on the column so the index is used
const dayRange = (column: string) =>
  `${column} >= ($1::date::timestamp at time zone '${TZ}')
   and ${column} < (($1::date + 1)::timestamp at time zone '${TZ}')`;

const ROLLUP_AREAS = `
  with base as (
    select b.device_class, a.area_id, a.renders, a.slow_renders, a.hist, a.min_ms, a.max_ms
      from render_areas a join render_batches b on b.id = a.batch_id
     where ${dayRange('b.received_at')}
  ),
  buckets as (
    select area_id, device_class, i, sum(v)::bigint as total
      from base, unnest(hist) with ordinality as u(v, i)
     group by area_id, device_class, i
  ),
  totals as (
    select area_id, device_class, count(*) as samples, sum(renders) as renders,
           sum(slow_renders) as slow_renders, min(min_ms) as min_ms, max(max_ms) as max_ms
      from base group by area_id, device_class
  )
  insert into render_daily
    (day, area_id, device_class, samples, renders, slow_renders, hist, min_ms, max_ms)
  select $1::date, t.area_id, t.device_class, t.samples, t.renders, t.slow_renders,
         (select array_agg(s.total order by s.i) from buckets s
           where s.area_id = t.area_id and s.device_class = t.device_class),
         t.min_ms, t.max_ms
    from totals t
  on conflict (day, area_id, device_class) do update set
    samples = excluded.samples, renders = excluded.renders,
    slow_renders = excluded.slow_renders, hist = excluded.hist,
    min_ms = excluded.min_ms, max_ms = excluded.max_ms`;

const ROLLUP_PAGES = `
  insert into render_daily_pages (day, device_class, page_views, long_tasks, long_task_ms)
  select $1::date, device_class, count(*) filter (where first_batch),
         sum(long_tasks), sum(long_task_ms)
    from render_batches where ${dayRange('received_at')}
   group by device_class
  on conflict (day, device_class) do update set
    page_views = excluded.page_views, long_tasks = excluded.long_tasks,
    long_task_ms = excluded.long_task_ms`;

// Daily maintenance, run by Vercel Cron at 01:00 IST: rolls up the last two
// days (re-running is safe, so late batches are included), then deletes raw
// data older than 30 days, rollups older than 2 years, and old rate-limit
// counters. ?day=YYYY-MM-DD rolls up one specific day instead.
export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response(null, { status: 401 });
  }

  const requested = new URL(request.url).searchParams.get('day');
  if (requested !== null && !/^\d{4}-\d{2}-\d{2}$/.test(requested)) {
    return Response.json({ error: 'day must be YYYY-MM-DD' }, { status: 400 });
  }

  try {
    const days = requested
      ? [requested]
      : (
          await pool.query(
            `select ((now() at time zone '${TZ}')::date - d)::text as day
               from generate_series(1, 2) as d`
          )
        ).rows.map((row) => String(row.day));

    const rolledUp: Record<string, number> = {};
    for (const day of days) {
      const areas = await pool.query(ROLLUP_AREAS, [day]);
      await pool.query(ROLLUP_PAGES, [day]);
      rolledUp[day] = (areas as { rowCount?: number }).rowCount ?? 0;
    }

    const deleted = {
      rawBatches: await count(
        `delete from render_batches where received_at < now() - interval '30 days'`
      ),
      dailyRows: await count(
        `delete from render_daily where day < current_date - interval '2 years'`
      ),
      dailyPageRows: await count(
        `delete from render_daily_pages where day < current_date - interval '2 years'`
      ),
      rateLimitRows: await count(
        `delete from render_rate_limits where window_start < now() - interval '1 day'`
      ),
    };

    return Response.json({ ok: true, rolledUp, deleted });
  } catch (error) {
    console.error('render-pulse maintenance:', error);
    return Response.json({ ok: false }, { status: 500 });
  }
}

const count = async (sql: string) =>
  ((await pool.query(sql)) as { rowCount?: number }).rowCount ?? 0;
