import pg from 'pg';

// One small pool per function instance, reused across requests.
// DATABASE_URL is Neon's pooled connection string, added by the Vercel integration.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
});

// The one method used from a pool or client
export interface Queryable {
  query: (
    text: string,
    params?: unknown[]
  ) => Promise<{ rows: Record<string, unknown>[] }>;
}
