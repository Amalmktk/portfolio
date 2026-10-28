// Runs every db/migrations/*.sql file, in order, against DATABASE_URL.
// The migrations use "if not exists", so running them again is safe.
// Usage: npm run db:migrate (reads .env.local if present: `vercel env pull .env.local`)
import { readdir, readFile } from 'node:fs/promises';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    'DATABASE_URL is not set. Run `vercel env pull .env.local` first.'
  );
  process.exit(1);
}

const dir = new URL('../db/migrations/', import.meta.url);
const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  for (const file of files) {
    await client.query(await readFile(new URL(file, dir), 'utf8'));
    console.log(`applied ${file}`);
  }
} finally {
  await client.end();
}
