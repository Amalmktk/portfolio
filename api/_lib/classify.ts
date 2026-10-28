import type { DeviceClass } from '../../src/types/performance.js';

export type ViewportClass = 'mobile' | 'tablet' | 'desktop';

const RANK = { low: 0, mid: 1, high: 2 } as const;
type Rank = keyof typeof RANK;

// navigator.deviceMemory reports at most 8 (GB)
const memoryClass = (gb: number): Rank =>
  gb <= 2 ? 'low' : gb < 8 ? 'mid' : 'high';
// Most phones report 8 cores; laptops and desktops usually more
const coresClass = (cores: number): Rank =>
  cores <= 4 ? 'low' : cores <= 8 ? 'mid' : 'high';

// Coarse device class from memory and CPU cores: the lower of the two signals,
// so a device is only "high" when nothing suggests otherwise. Only the class
// is stored, never the numbers.
export const deviceClass = (device: {
  memoryGb: number | null;
  cores: number | null;
}): DeviceClass => {
  const classes: Rank[] = [];
  if (device.memoryGb !== null) classes.push(memoryClass(device.memoryGb));
  if (device.cores !== null) classes.push(coresClass(device.cores));
  if (classes.length === 0) return 'unknown';
  return classes.reduce((a, b) => (RANK[a] <= RANK[b] ? a : b));
};

// Coarse viewport class from "390x844" (CSS pixels); the exact size isn't stored
export const viewportClass = (viewport: string): ViewportClass => {
  const width = Number(viewport.split('x')[0]);
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};
