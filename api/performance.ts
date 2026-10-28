import { postgresStorage } from 'react-render-pulse-collector/postgres';
import { buildReport, toBatchQuery } from 'react-render-pulse-viewer';
import type { PerformanceSummary } from '../src/types/performance';

const DAYS = 30;
// Bounds the work per refresh; far above what a personal site sends in 30 days
const MAX_BATCHES = 20_000;

const storage = postgresStorage({ url: process.env.DATABASE_URL ?? '' });

// Public, read-only summary for the Performance section. Only aggregates leave
// the server (no batches, session ids or device details beyond memory · cores),
// and Vercel's CDN caches it, so the database is read at most every 15 minutes.
export async function GET(): Promise<Response> {
  try {
    const batches = await storage.read({
      ...toBatchQuery({ since: `${DAYS}d` }),
      limit: MAX_BATCHES,
    });
    const report = buildReport(batches);

    const summary: PerformanceSummary = {
      generatedAt: report.generatedAt,
      days: DAYS,
      sessions: report.sessions,
      renders: report.totals.renders,
      slowRate: report.totals.slowRate,
      p75: report.totals.p75,
      p95: report.totals.p95,
      longTasksPerSession: report.totals.longTasksPerSession,
      areas: report.areas
        .slice(0, 8)
        .map(({ id, renders, p75, p95 }) => ({ id, renders, p75, p95 })),
      byDay: report.byDay.map(({ key, sessions, p75 }) => ({
        day: key,
        sessions,
        p75,
      })),
      devices: report.devices
        .slice(0, 5)
        .map(({ key, sessions, p75 }) => ({ device: key, sessions, p75 })),
    };

    return Response.json(summary, {
      headers: {
        'cache-control': 'public, s-maxage=900, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('performance summary:', error);
    return Response.json(
      { error: 'Live data is unavailable' },
      { status: 503, headers: { 'cache-control': 'no-store' } }
    );
  }
}
