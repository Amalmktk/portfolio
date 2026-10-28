// Shape of GET /api/performance: anonymous, aggregated render timings
// from this site's visitors, measured by react-render-pulse.
export interface PerformanceSummary {
  generatedAt: string;
  days: number;
  sessions: number;
  renders: number;
  // Share of renders slower than one frame (16 ms), 0–1
  slowRate: number;
  p75: number;
  p95: number;
  longTasksPerSession: number;
  areas: { id: string; renders: number; p75: number; p95: number }[];
  byDay: { day: string; sessions: number; p75: number }[];
  devices: { device: string; sessions: number; p75: number }[];
}
