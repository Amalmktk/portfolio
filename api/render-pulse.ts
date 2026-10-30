import {
  createCollector,
  type Storage,
  type StoredBatch,
} from 'react-render-pulse-collector';
import type { PoolClient } from 'pg';
import { deviceClass, viewportClass } from './_lib/classify.js';
import { pool } from './_lib/db.js';
import { DAY_MS, hit, VISITOR_LIMIT, visitorKey } from './_lib/rateLimit.js';

const ALLOWED_ORIGINS = ['https://itzamal.in', 'https://www.itzamal.in'];
// Batches accepted per day across all visitors, protecting the free database quota
const DAILY_CAP = Number(process.env.RENDER_PULSE_DAILY_CAP ?? 3000);
// Slowest renders kept per batch; the daily rollup keeps the slowest 20 of these
const WORST_PER_BATCH = 3;

// One multi-row insert: `rows` are tuples of values in `columns` order
const insertRows = (
  client: PoolClient,
  table: string,
  columns: string[],
  rows: unknown[][]
) => {
  if (rows.length === 0) return;
  const tuples = rows.map(
    (row, i) =>
      `(${row.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`
  );
  return client.query(
    `insert into ${table} (${columns.join(', ')}) values ${tuples.join(', ')}`,
    rows.flat()
  );
};

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
            connection, first_batch, long_tasks, long_task_ms, long_frames,
            long_frame_ms)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
          payload.summary.longFrames,
          payload.summary.longFrameMs,
        ]
      );
      const batchId = rows[0].id;

      await insertRows(
        client,
        'render_areas',
        [
          'batch_id',
          'area_id',
          'renders',
          'mounts',
          'slow_renders',
          'total_ms',
          'hist',
          'min_ms',
          'max_ms',
        ],
        payload.areas.map((area) => [
          batchId,
          area.id,
          area.renders,
          area.mounts,
          area.slow,
          area.totalMs,
          area.hist,
          area.min,
          area.max,
        ])
      );

      await insertRows(
        client,
        'render_blocks',
        ['batch_id', 'kind', 'area_id', 'count', 'total_ms', 'max_ms'],
        [
          ...payload.longTasks.map((block) => ['longtask', block] as const),
          ...payload.longFrames.map(
            (block) => ['long-animation-frame', block] as const
          ),
        ].map(([kind, block]) => [
          batchId,
          kind,
          block.area,
          block.count,
          block.totalMs,
          block.maxMs,
        ])
      );

      await insertRows(
        client,
        'render_worst',
        ['batch_id', 'area_id', 'phase', 'ms'],
        payload.areas
          .flatMap((area) =>
            area.worst.map((render) => [area.id, render] as const)
          )
          .sort(([, a], [, b]) => b.ms - a.ms)
          .slice(0, WORST_PER_BATCH)
          .map(([areaId, render]) => [batchId, areaId, render.phase, render.ms])
      );
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
