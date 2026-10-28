import {
  createCollector,
  type Storage,
  type StoredBatch,
} from 'react-render-pulse-collector';
import { deviceClass, viewportClass } from './_lib/classify.js';
import { pool } from './_lib/db.js';
import { DAY_MS, hit, VISITOR_LIMIT, visitorKey } from './_lib/rateLimit.js';

const ALLOWED_ORIGINS = ['https://itzamal.in', 'https://www.itzamal.in'];
// Batches accepted per day across all visitors, protecting the free database quota
const DAILY_CAP = Number(process.env.RENDER_PULSE_DAILY_CAP ?? 3000);

// Writes a validated batch into the raw tables, keeping only coarse, anonymous
// fields: no session id, IP, exact screen size or device specs.
const tableStorage: Storage = {
  async write({ receivedAt, payload }: StoredBatch) {
    // Over the daily cap, drop silently: the visitor's page is unaffected
    if ((await hit(pool, 'daily', DAY_MS)) > DAILY_CAP) return;

    const client = await pool.connect();
    try {
      await client.query('begin');
      const { rows } = await client.query(
        `insert into render_batches
           (received_at, route, mode, app_version, device_class, viewport_class,
            connection, first_batch, long_tasks, long_task_ms)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         returning id`,
        [
          receivedAt,
          payload.session.route,
          payload.session.mode,
          payload.session.appVersion,
          deviceClass(payload.device),
          viewportClass(payload.device.viewport),
          payload.device.connection,
          payload.session.seq === 1,
          payload.summary.longTasks,
          payload.summary.longTaskMs,
        ]
      );
      const batchId = rows[0].id;

      if (payload.areas.length > 0) {
        // One multi-row insert for all areas in the batch
        const values: unknown[] = [];
        const tuples = payload.areas.map((area, i) => {
          values.push(
            batchId,
            area.id,
            area.renders,
            area.slow,
            area.hist,
            area.min,
            area.max
          );
          const n = i * 7;
          return `($${n + 1}, $${n + 2}, $${n + 3}, $${n + 4}, $${n + 5}, $${n + 6}, $${n + 7})`;
        });
        await client.query(
          `insert into render_areas
             (batch_id, area_id, renders, slow_renders, hist, min_ms, max_ms)
           values ${tuples.join(', ')}`,
          values
        );
      }
      await client.query('commit');
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  },
  async read() {
    throw new Error('Read through /api/render-pulse-stats');
  },
};

// Validates (strict schema, 20 KB limit, allowed origins) and stores batches.
const collect = createCollector({
  storage: tableStorage,
  maxBodyBytes: 20_000,
  allowedOrigins: ALLOWED_ORIGINS,
  // The per-visitor limit below is shared across instances, unlike the built-in one
  rateLimit: false,
  onError: (error) => console.error('render-pulse collector:', error),
});

// Receives batches from visitors' browsers. Each visitor may send 5 batches per
// 10 minutes; this only limits sending data, never viewing the site.
export async function POST(request: Request): Promise<Response> {
  const key = visitorKey(request);
  if (
    key &&
    (await hit(pool, key, VISITOR_LIMIT.windowMs)) > VISITOR_LIMIT.max
  ) {
    return new Response(null, {
      status: 429,
      headers: { 'retry-after': '600' },
    });
  }
  return collect(request);
}

export const OPTIONS = collect;
