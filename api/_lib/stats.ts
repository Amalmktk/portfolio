import { HISTOGRAM_BOUNDS, histogramPercentile } from 'react-render-pulse/core';
import type {
  AreaStats,
  DeviceClass,
  PerformanceHeadline,
  PerformanceStats,
  Percentiles,
} from '../../src/types/performance.js';

// Areas measured fewer times than this are left out: thin data misleads
export const MIN_SAMPLES = 30;

export interface DailyAreaRow {
  day: string;
  area_id: string;
  device_class: DeviceClass;
  samples: number | string;
  renders: number | string;
  slow_renders: number | string;
  hist: (number | string)[];
  min_ms: number;
  max_ms: number;
}

export interface DailyPagesRow {
  day: string;
  device_class: DeviceClass;
  page_views: number | string;
  long_tasks: number | string;
}

// Merged timings for any group of rollup rows. Percentiles come from summed
// histograms: averaging per-day percentiles would give wrong answers.
interface Group {
  samples: number;
  renders: number;
  slow: number;
  hist: number[];
  min: number;
  max: number;
}

const emptyGroup = (): Group => ({
  samples: 0,
  renders: 0,
  slow: 0,
  hist: new Array<number>(HISTOGRAM_BOUNDS.length + 1).fill(0),
  min: Infinity,
  max: 0,
});

const add = (group: Group, row: DailyAreaRow) => {
  group.samples += Number(row.samples);
  group.renders += Number(row.renders);
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

const groupBy = <K>(rows: DailyAreaRow[], keyOf: (row: DailyAreaRow) => K) => {
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

export const buildStats = (
  areaRows: DailyAreaRow[],
  pageRows: DailyPagesRow[],
  now = new Date()
): PerformanceStats => {
  const all = groupBy(areaRows, () => 'all').get('all') ?? emptyGroup();
  const days = [
    ...new Set(areaRows.map((r) => r.day).concat(pageRows.map((r) => r.day))),
  ].sort();

  const pageViews = pageRows.reduce((sum, r) => sum + Number(r.page_views), 0);
  const longTasks = pageRows.reduce((sum, r) => sum + Number(r.long_tasks), 0);
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
    longTasksPerView:
      pageViews === 0 ? 0 : Math.round((longTasks / pageViews) * 100) / 100,
    minSamples: MIN_SAMPLES,
    areas,
    hiddenAreas,
    devices,
    trend,
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
