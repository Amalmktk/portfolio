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
  // Share of renders slower than one frame (16 ms), 0–1
  slowShare: number;
  byDevice: Partial<Record<DeviceClass, { p75: number; samples: number }>>;
}

export interface PerformanceStats extends Percentiles {
  updatedAt: string;
  range: { from: string; to: string } | null;
  pageViews: number;
  renders: number;
  slowShare: number;
  longTasksPerView: number;
  // Areas with fewer samples are left out rather than shown with thin data
  minSamples: number;
  areas: AreaStats[];
  hiddenAreas: number;
  devices: { deviceClass: DeviceClass; pageViews: number; p75: number }[];
  trend: { day: string; pageViews: number; p75: number }[];
}

// GET /api/render-pulse-stats?summary=1, for small teasers
export interface PerformanceHeadline {
  updatedAt: string;
  pageViews: number;
  p75: number;
  slowestArea: { id: string; p75: number } | null;
}
