import { HISTOGRAM_BOUNDS, histogramPercentile } from 'react-render-pulse/core';
import type {
  AreaStats,
  DeviceClass,
  PerformanceHeadline,
  PerformanceStats,
  Percentiles,
  ReleaseComparison,
  WorstRender,
} from '../../src/types/performance.js';

// Areas measured fewer times than this are left out: thin data misleads
export const MIN_SAMPLES = 30;

// Timings for one section from one rollup row
interface TimingRow {
  day: string;
  area_id: string;
  samples: number | string;
  renders: number | string;
  mounts: number | string;
  slow_renders: number | string;
  hist: (number | string)[];
  min_ms: number;
  max_ms: number;
}

export interface DailyAreaRow extends TimingRow {
  device_class: DeviceClass;
}

export interface DailyVersionRow extends TimingRow {
  app_version: string;
}

export interface DailyPagesRow {
  day: string;
  device_class: DeviceClass;
  page_views: number | string;
  long_tasks: number | string;
  long_frames: number | string;
}

// Long animation frames per section over the period ('' = outside React renders)
export interface BlockRow {
  area_id: string;
  count: number | string;
  total_ms: number;
  max_ms: number;
}

export interface WorstRow {
  day: string;
  area_id: string;
  device_class: DeviceClass;
  phase: 'mount' | 'update' | 'nested-update';
  ms: number;
}

export interface StatsRows {
  areas: DailyAreaRow[];
  pages: DailyPagesRow[];
  blocks?: BlockRow[];
  worst?: WorstRow[];
  versions?: DailyVersionRow[];
}

// Merged timings for any group of rollup rows. Percentiles come from summed
// histograms: averaging per-day percentiles would give wrong answers.
interface Group {
  samples: number;
  renders: number;
  mounts: number;
  slow: number;
  hist: number[];
  min: number;
  max: number;
}

const emptyGroup = (): Group => ({
  samples: 0,
  renders: 0,
  mounts: 0,
  slow: 0,
  hist: new Array<number>(HISTOGRAM_BOUNDS.length + 1).fill(0),
  min: Infinity,
  max: 0,
});

const add = (group: Group, row: TimingRow) => {
  group.samples += Number(row.samples);
  group.renders += Number(row.renders);
  group.mounts += Number(row.mounts);
  group.slow += Number(row.slow_renders);
  row.hist.forEach(
    (n, i) => (group.hist[i] = (group.hist[i] ?? 0) + Number(n))
  );
  group.min = Math.min(group.min, row.min_ms);
  group.max = Math.max(group.max, row.max_ms);
};

const percentiles = (group: Group): Percentiles => {
  const min = Number.isFinite(group.min) ? group.min : 0;
  return {
    p50: histogramPercentile(group.hist, 50, group.max, min),
    p75: histogramPercentile(group.hist, 75, group.max, min),
    p95: histogramPercentile(group.hist, 95, group.max, min),
  };
};

const groupBy = <R extends TimingRow, K>(rows: R[], keyOf: (row: R) => K) => {
  const groups = new Map<K, Group>();
  for (const row of rows) {
    const key = keyOf(row);
    let group = groups.get(key);
    if (!group) groups.set(key, (group = emptyGroup()));
    add(group, row);
  }
  return groups;
};

const share = (part: number, whole: number) => (whole === 0 ? 0 : part / whole);
const perView = (total: number, views: number) =>
  views === 0 ? 0 : Math.round((total / views) * 100) / 100;

// The latest release with enough data against the one before it. Releases are
// ordered by the first day they were measured.
const compareReleases = (rows: DailyVersionRow[]): ReleaseComparison | null => {
  const known = rows.filter((r) => r.app_version !== 'unknown');
  const since = new Map<string, string>();
  for (const r of known) {
    const first = since.get(r.app_version);
    if (!first || r.day < first) since.set(r.app_version, r.day);
  }

  const releases = [...groupBy(known, (r) => r.app_version)]
    .filter(([, group]) => group.samples >= MIN_SAMPLES)
    .map(([version, group]) => ({
      version,
      since: since.get(version)!,
      samples: group.samples,
      p75: percentiles(group).p75,
    }))
    .sort(
      (a, b) =>
        a.since.localeCompare(b.since) || a.version.localeCompare(b.version)
    );
  if (releases.length < 2) return null;
  const current = releases[releases.length - 1]!;
  const previous = releases[releases.length - 2]!;

  const byReleaseArea = groupBy(
    known,
    (r) => `${r.app_version}\u0000${r.area_id}`
  );
  const areaP75 = (version: string, id: string) => {
    const group = byReleaseArea.get(`${version}\u0000${id}`);
    return group && group.samples >= MIN_SAMPLES
      ? percentiles(group).p75
      : null;
  };
  const areas = [...new Set(known.map((r) => r.area_id))]
    .flatMap((id) => {
      const now = areaP75(current.version, id);
      const before = areaP75(previous.version, id);
      return now === null || before === null
        ? []
        : [{ id, current: now, previous: before }];
    })
    // Biggest change first, either way
    .sort(
      (a, b) =>
        Math.abs(b.current - b.previous) - Math.abs(a.current - a.previous)
    );

  return { current, previous, areas };
};

export const buildStats = (
  {
    areas: areaRows,
    pages: pageRows,
    blocks = [],
    worst = [],
    versions = [],
  }: StatsRows,
  now = new Date()
): PerformanceStats => {
  const all = groupBy(areaRows, () => 'all').get('all') ?? emptyGroup();
  const days = [
    ...new Set(areaRows.map((r) => r.day).concat(pageRows.map((r) => r.day))),
  ].sort();

  const pageViews = pageRows.reduce((sum, r) => sum + Number(r.page_views), 0);
  const longTasks = pageRows.reduce((sum, r) => sum + Number(r.long_tasks), 0);
  const longFrames = pageRows.reduce(
    (sum, r) => sum + Number(r.long_frames),
    0
  );
  const viewsByDevice = new Map<DeviceClass, number>();
  const viewsByDay = new Map<string, number>();
  for (const r of pageRows) {
    viewsByDevice.set(
      r.device_class,
      (viewsByDevice.get(r.device_class) ?? 0) + Number(r.page_views)
    );
    viewsByDay.set(r.day, (viewsByDay.get(r.day) ?? 0) + Number(r.page_views));
  }

  const byAreaDevice = groupBy(
    areaRows,
    (r) => `${r.area_id}\u0000${r.device_class}`
  );
  const areas: AreaStats[] = [];
  let hiddenAreas = 0;
  for (const [id, group] of groupBy(areaRows, (r) => r.area_id)) {
    if (group.samples < MIN_SAMPLES) {
      hiddenAreas++;
      continue;
    }
    const byDevice: AreaStats['byDevice'] = {};
    for (const [key, deviceGroup] of byAreaDevice) {
      const [areaId, deviceClass] = key.split('\u0000') as [
        string,
        DeviceClass,
      ];
      if (areaId !== id || deviceGroup.samples < MIN_SAMPLES) continue;
      byDevice[deviceClass] = {
        p75: percentiles(deviceGroup).p75,
        samples: deviceGroup.samples,
      };
    }
    areas.push({
      id,
      samples: group.samples,
      renders: group.renders,
      mounts: group.mounts,
      slowShare: share(group.slow, group.renders),
      ...percentiles(group),
      byDevice,
    });
  }
  areas.sort((a, b) => b.p75 - a.p75);

  const devices = [...groupBy(areaRows, (r) => r.device_class)]
    .filter(([, group]) => group.samples >= MIN_SAMPLES)
    .map(([deviceClass, group]) => ({
      deviceClass,
      pageViews: viewsByDevice.get(deviceClass) ?? 0,
      p75: percentiles(group).p75,
    }))
    .sort((a, b) => b.p75 - a.p75);

  const byDay = groupBy(areaRows, (r) => r.day);
  const trend = days.map((day) => ({
    day,
    pageViews: viewsByDay.get(day) ?? 0,
    p75: byDay.has(day) ? percentiles(byDay.get(day)!).p75 : 0,
  }));

  return {
    updatedAt: now.toISOString(),
    range:
      days.length > 0 ? { from: days[0]!, to: days[days.length - 1]! } : null,
    pageViews,
    renders: all.renders,
    slowShare: share(all.slow, all.renders),
    ...percentiles(all),
    longTasksPerView: perView(longTasks, pageViews),
    longFramesPerView: perView(longFrames, pageViews),
    minSamples: MIN_SAMPLES,
    areas,
    hiddenAreas,
    devices,
    trend,
    blocks: blocks
      .map((r) => ({
        area: r.area_id === '' ? null : r.area_id,
        count: Number(r.count),
        totalMs: r.total_ms,
        maxMs: r.max_ms,
      }))
      .sort((a, b) => b.totalMs - a.totalMs),
    worst: worst
      .map(
        (r): WorstRender => ({
          area: r.area_id,
          ms: r.ms,
          phase: r.phase === 'mount' ? 'mount' : 'update',
          deviceClass: r.device_class,
          day: r.day,
        })
      )
      .sort((a, b) => b.ms - a.ms),
    release: compareReleases(versions),
  };
};

export const headline = (stats: PerformanceStats): PerformanceHeadline => ({
  updatedAt: stats.updatedAt,
  pageViews: stats.pageViews,
  p75: stats.p75,
  slowestArea: stats.areas[0]
    ? { id: stats.areas[0].id, p75: stats.areas[0].p75 }
    : null,
});
