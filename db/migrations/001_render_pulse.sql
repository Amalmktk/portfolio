-- Storage for the live performance section (react-render-pulse).
-- Raw rows are kept 30 days and daily rollups 2 years; api/cron/render-pulse-maintain.ts
-- does the rollup and cleanup. Nothing identifies a visitor: no session ids,
-- IP addresses, exact screen sizes or device specs, only coarse classes.

-- Raw: one row per batch a page sends
create table if not exists render_batches (
  id             bigserial primary key,
  received_at    timestamptz not null default now(),
  route          text not null,
  mode           text not null check (mode in ('profiling', 'lightweight')),
  app_version    text,
  device_class   text not null check (device_class in ('low', 'mid', 'high', 'unknown')),
  viewport_class text not null check (viewport_class in ('mobile', 'tablet', 'desktop')),
  connection     text,
  -- The first batch of a page load; counting these counts page views
  first_batch    boolean not null,
  long_tasks     integer not null default 0,
  long_task_ms   real not null default 0
);
create index if not exists render_batches_received_at_idx on render_batches (received_at);

-- Raw: one row per measured section in a batch
create table if not exists render_areas (
  batch_id     bigint not null references render_batches (id) on delete cascade,
  area_id      text not null,
  renders      integer not null,
  slow_renders integer not null,
  -- Render counts in react-render-pulse's 16 duration buckets (payload v1)
  hist         integer[] not null,
  min_ms       real not null,
  max_ms       real not null
);
create index if not exists render_areas_batch_id_idx on render_areas (batch_id);

-- Daily rollups per section and device class (what the stats endpoint reads)
create table if not exists render_daily (
  day          date not null,
  area_id      text not null,
  device_class text not null,
  samples      integer not null,
  renders      bigint not null,
  slow_renders bigint not null,
  hist         bigint[] not null,
  min_ms       real not null,
  max_ms       real not null,
  primary key (day, area_id, device_class)
);

-- Daily page views and long tasks per device class
create table if not exists render_daily_pages (
  day          date not null,
  device_class text not null,
  page_views   integer not null,
  long_tasks   bigint not null,
  long_task_ms double precision not null,
  primary key (day, device_class)
);

-- Rate-limit counters. Keys are salted hashes of IP addresses (never the IP
-- itself) or "daily"; rows are deleted after a day by the maintenance job.
create table if not exists render_rate_limits (
  key          text primary key,
  window_start timestamptz not null,
  count        integer not null
);
