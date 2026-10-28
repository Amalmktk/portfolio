import { createCollector } from 'react-render-pulse-collector';
import { postgresStorage } from 'react-render-pulse-collector/postgres';

// Receives render-pulse batches from this site's visitors and stores them in
// Postgres (DATABASE_URL, set in the Vercel project). The table is created on
// the first batch. Other origins, including preview deployments, get a 403.
const collect = createCollector({
  storage: postgresStorage({ url: process.env.DATABASE_URL ?? '' }),
  allowedOrigins: ['https://itzamal.in', 'https://www.itzamal.in'],
  onError: (error) => console.error('render-pulse collector:', error),
});

export const POST = collect;
export const OPTIONS = collect;
