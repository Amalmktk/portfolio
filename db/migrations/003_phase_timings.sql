-- First renders and updates measured apart (react-render-pulse 1.1). Each section's
-- timings are split into a histogram plus fastest and slowest render per phase, so a
-- slow first render doesn't hide slow updates. Nothing here identifies a visitor.
-- Every statement is safe to run again. Columns are null for batches sent by a client
-- before 1.1, so the split only covers visits made after this was deployed.
--
-- Run this BEFORE deploying the code that writes these columns.

-- Raw: per batch and section. `update` covers every render after the first, including
-- React's nested updates. The renders of a phase are the sum of its histogram.
alter table render_areas add column if not exists mount_hist  integer[];
alter table render_areas add column if not exists mount_min_ms real;
alter table render_areas add column if not exists mount_max_ms real;
alter table render_areas add column if not exists update_hist  integer[];
alter table render_areas add column if not exists update_min_ms real;
alter table render_areas add column if not exists update_max_ms real;

-- Rollup: per day, section and device class (what the stats endpoint reads)
alter table render_daily add column if not exists mount_hist  bigint[];
alter table render_daily add column if not exists mount_min_ms real;
alter table render_daily add column if not exists mount_max_ms real;
alter table render_daily add column if not exists update_hist  bigint[];
alter table render_daily add column if not exists update_min_ms real;
alter table render_daily add column if not exists update_max_ms real;
