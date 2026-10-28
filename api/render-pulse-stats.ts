import { pool } from './_lib/db.js';
import {
  buildStats,
  headline,
  type DailyAreaRow,
  type DailyPagesRow,
} from './_lib/stats.js';

const DAYS = 30;

// Public, read-only stats for the Performance section: aggregates of the daily
// rollups only (no raw rows). Vercel's CDN caches responses for an hour, so
// most visits never reach the database. ?summary=1 returns just the headline.
export async function GET(request: Request): Promise<Response> {
  try {
    const since = `(now() at time zone 'Asia/Kolkata')::date - ${DAYS}`;
    const [areas, pages] = await Promise.all([
      pool.query(
        `select day::text as day, area_id, device_class, samples, renders,
                slow_renders, hist, min_ms, max_ms
           from render_daily where day >= ${since}`
      ),
      pool.query(
        `select day::text as day, device_class, page_views, long_tasks
           from render_daily_pages where day >= ${since}`
      ),
    ]);
    const stats = buildStats(
      areas.rows as unknown as DailyAreaRow[],
      pages.rows as unknown as DailyPagesRow[]
    );
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
