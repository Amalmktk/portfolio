import { pool } from './_lib/db.js';
import { buildStats, headline, type StatsRows } from './_lib/stats.js';

const DAYS = 30;
// Releases are compared over a longer window, so a quiet month still has a
// previous release to compare against
const RELEASE_DAYS = 90;
const WORST_SHOWN = 5;

// Public, read-only stats for the Performance section: aggregates of the daily
// rollups only (no raw rows). Vercel's CDN caches responses for an hour, so
// most visits never reach the database. ?summary=1 returns just the headline.
export async function GET(request: Request): Promise<Response> {
  try {
    const sinceDays = (days: number) =>
      `(now() at time zone 'Asia/Kolkata')::date - ${days}`;
    const since = sinceDays(DAYS);
    const [areas, pages, blocks, worst, versions] = await Promise.all([
      pool.query(
        `select day::text as day, area_id, device_class, samples, renders,
                mounts, slow_renders, hist, min_ms, max_ms
           from render_daily where day >= ${since}`
      ),
      pool.query(
        `select day::text as day, device_class, page_views, long_tasks, long_frames
           from render_daily_pages where day >= ${since}`
      ),
      pool.query(
        `select area_id, sum(count) as count, sum(total_ms) as total_ms,
                max(max_ms) as max_ms
           from render_daily_blocks
          where kind = 'long-animation-frame' and day >= ${since}
          group by area_id`
      ),
      pool.query(
        `select day::text as day, area_id, device_class, phase, ms
           from render_daily_worst where day >= ${since}
          order by ms desc limit ${WORST_SHOWN}`
      ),
      pool.query(
        `select day::text as day, app_version, area_id, samples, renders,
                mounts, slow_renders, hist, min_ms, max_ms
           from render_daily_versions where day >= ${sinceDays(RELEASE_DAYS)}`
      ),
    ]);
    const stats = buildStats({
      areas: areas.rows,
      pages: pages.rows,
      blocks: blocks.rows,
      worst: worst.rows,
      versions: versions.rows,
    } as unknown as StatsRows);
    const summaryOnly =
      new URL(request.url).searchParams.get('summary') === '1';

    return Response.json(summaryOnly ? headline(stats) : stats, {
      headers: {
        'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('render-pulse stats:', error);
    return Response.json(
      { error: 'Live data is unavailable' },
      { status: 503, headers: { 'cache-control': 'no-store' } }
    );
  }
}
