// Shape of GET /api/render-pulse-stats: anonymous, aggregated render timings
// from this site's visitors, measured by react-render-pulse and rolled up daily.

export type DeviceClass = 'low' | 'mid' | 'high' | 'unknown';

export interface Percentiles {
  p50: number;
  p75: number;
  p95: number;
}

export interface AreaStats extends Percentiles {
  id: string;
  samples: number;
  renders: number;
  // First renders; the rest of `renders` are updates
  mounts: number;
  // Share of renders slower than one frame (16 ms), 0–1
  slowShare: number;
  byDevice: Partial<Record<DeviceClass, { p75: number; samples: number }>>;
}

// Long animation frames (50 ms or more) by the section that was rendering
export interface BlockStats {
  // null: no React render overlapped the frame (animations, event handlers)
  area: string | null;
  count: number;
  totalMs: number;
  maxMs: number;
}

// One of the slowest renders in the period
export interface WorstRender {
  area: string;
  ms: number;
  phase: 'mount' | 'update';
  deviceClass: DeviceClass;
  day: string;
}

export interface ReleaseStats {
  // Short commit hash of the deployment
  version: string;
  // First day it was measured
  since: string;
  samples: number;
  p75: number;
}

// The latest release against the one before it, overall and per section
export interface ReleaseComparison {
  current: ReleaseStats;
  previous: ReleaseStats;
  areas: { id: string; current: number; previous: number }[];
}

export interface PerformanceStats extends Percentiles {
  updatedAt: string;
  range: { from: string; to: string } | null;
  pageViews: number;
  renders: number;
  slowShare: number;
  longTasksPerView: number;
  longFramesPerView: number;
  // Areas with fewer samples are left out rather than shown with thin data
  minSamples: number;
  areas: AreaStats[];
  hiddenAreas: number;
  devices: { deviceClass: DeviceClass; pageViews: number; p75: number }[];
  trend: { day: string; pageViews: number; p75: number }[];
  // Most blocked time first
  blocks: BlockStats[];
  // Slowest first
  worst: WorstRender[];
  release: ReleaseComparison | null;
}

// GET /api/render-pulse-stats?summary=1, for small teasers
export interface PerformanceHeadline {
  updatedAt: string;
  pageViews: number;
  p75: number;
  slowestArea: { id: string; p75: number } | null;
}
