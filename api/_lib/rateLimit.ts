import { createHmac } from 'node:crypto';
import type { Queryable } from './db.js';

export const VISITOR_LIMIT = { max: 5, windowMs: 10 * 60_000 };
export const DAY_MS = 24 * 60 * 60_000;

// Counts a hit for `key` in the current fixed window and returns the count so
// far. Counters live in Postgres so every serverless instance shares them.
export const hit = async (
  db: Queryable,
  key: string,
  windowMs: number,
  now = Date.now()
): Promise<number> => {
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const { rows } = await db.query(
    `insert into render_rate_limits (key, window_start, count) values ($1, $2, 1)
     on conflict (key) do update set
       count = case when render_rate_limits.window_start = excluded.window_start
                    then render_rate_limits.count + 1 else 1 end,
       window_start = excluded.window_start
     returning count`,
    [key, windowStart]
  );
  return Number(rows[0]?.count ?? 0);
};

// The visitor's rate-limit key: a salted hash of their IP, so the IP itself is
// never stored. Returns null without an IP or IP_HASH_SECRET (no per-visitor limit).
export const visitorKey = (
  request: Request,
  secret = process.env.IP_HASH_SECRET
): string | null => {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip');
  if (!ip || !secret) return null;
  return `ip:${createHmac('sha256', secret).update(ip).digest('hex').slice(0, 32)}`;
};
