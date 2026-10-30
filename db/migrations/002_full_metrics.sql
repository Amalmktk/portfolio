-- Keeps the rest of what react-render-pulse reports: first renders vs updates,
-- long animation frames and which section caused them, the slowest renders,
-- and timings per release. Still nothing that identifies a visitor.
-- Every statement is safe to run again.

-- Raw additions: long animation frames per batch, and first renders and total
-- render time per section
alter table render_batches add column if not exists long_frames integer not null default 0;
alter table render_batches add column if not exists long_frame_ms real not null default 0;
alter table render_areas add column if not exists mounts integer not null default 0;
alter table render_areas add column if not exists total_ms real not null default 0;

-- Raw: main-thread blocks (50 ms or more) in a batch, by the section that was
-- rendering. area_id is null when no React render overlapped the block
-- (animations, event handlers, other scripts). Reported by Chromium browsers.
create table if not exists render_blocks (
  batch_id bigint not null references render_batches (id) on delete cascade,
  kind     text not null check (kind in ('longtask', 'long-animation-frame')),
  area_id  text,
  count    integer not null,
  total_ms real not null,
  max_ms   real not null
);
create index if not exists render_blocks_batch_id_idx on render_blocks (batch_id);

-- Raw: the three slowest renders of each batch
create table if not exists render_worst (
  batch_id bigint not null references render_batches (id) on delete cascade,
  area_id  text not null,
  phase    text not null check (phase in ('mount', 'update', 'nested-update')),
  ms       real not null
);
create index if not exists render_worst_batch_id_idx on render_worst (batch_id);

-- Rollup additions
alter table render_daily add column if not exists mounts bigint not null default 0;
alter table render_daily add column if not exists total_ms double precision not null default 0;
alter table render_daily_pages add column if not exists long_frames bigint not null default 0;
alter table render_daily_pages add column if not exists long_frame_ms double precision not null default 0;

-- Daily main-thread blocks per section and device class ('' = outside React renders)
create table if not exists render_daily_blocks (
  day          date not null,
  kind         text not null,
  area_id      text not null,
  device_class text not null,
  count        bigint not null,
  total_ms     double precision not null,
  max_ms       real not null,
  primary key (day, kind, area_id, device_class)
);

-- The 20 slowest renders of each day
create table if not exists render_daily_worst (
  day          date not null,
  rank         smallint not null,
  area_id      text not null,
  device_class text not null,
  phase        text not null,
  ms           real not null,
  primary key (day, rank)
);

-- Daily timings per release (the deployed commit) and section, for comparing releases
create table if not exists render_daily_versions (
  day          date not null,
  app_version  text not null,
  area_id      text not null,
  samples      integer not null,
  renders      bigint not null,
  mounts       bigint not null,
  slow_renders bigint not null,
  total_ms     double precision not null,
  hist         bigint[] not null,
  min_ms       real not null,
  max_ms       real not null,
  primary key (day, app_version, area_id)
);
