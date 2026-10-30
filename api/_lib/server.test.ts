import { describe, expect, it } from 'vitest';
import { deviceClass, viewportClass } from './classify';
import { visitorKey } from './rateLimit';
import {
  buildStats,
  headline,
  MIN_SAMPLES,
  type DailyAreaRow,
  type DailyVersionRow,
} from './stats';

describe('deviceClass', () => {
  it('uses the lower of the memory and cores classes', () => {
    expect(deviceClass({ memoryGb: 2, cores: 8 })).toBe('low');
    expect(deviceClass({ memoryGb: 4, cores: 8 })).toBe('mid');
    expect(deviceClass({ memoryGb: 8, cores: 12 })).toBe('high');
    expect(deviceClass({ memoryGb: 8, cores: 4 })).toBe('low');
  });

  it('works with only one signal, or none', () => {
    expect(deviceClass({ memoryGb: null, cores: 16 })).toBe('high');
    expect(deviceClass({ memoryGb: null, cores: null })).toBe('unknown');
  });
});

describe('viewportClass', () => {
  it('buckets by width', () => {
    expect(viewportClass('390x844')).toBe('mobile');
    expect(viewportClass('820x1180')).toBe('tablet');
    expect(viewportClass('1440x900')).toBe('desktop');
  });
});

describe('visitorKey', () => {
  const request = (ip: string) =>
    new Request('https://www.itzamal.in/api/render-pulse', {
      headers: { 'x-forwarded-for': `${ip}, 10.0.0.1` },
    });

  it('is a salted hash that never contains the IP', () => {
    const key = visitorKey(request('203.0.113.7'), 'secret');
    expect(key).toMatch(/^ip:[0-9a-f]{32}$/);
    expect(key).not.toContain('203.0.113.7');
    expect(visitorKey(request('203.0.113.7'), 'secret')).toBe(key);
    expect(visitorKey(request('203.0.113.7'), 'other-secret')).not.toBe(key);
  });

  it('is null without a secret or an IP', () => {
    expect(visitorKey(request('203.0.113.7'), undefined)).toBeNull();
    expect(visitorKey(new Request('https://x.test'), 'secret')).toBeNull();
  });
});

// 16-bucket histogram with all renders in one bucket (bucket 3 is 4–8 ms, bucket 6 is 16–24 ms)
const hist = (bucket: number, count: number) => {
  const h = new Array(16).fill(0);
  h[bucket] = count;
  return h;
};

const row = (overrides: Partial<DailyAreaRow>): DailyAreaRow => ({
  day: '2026-10-27',
  area_id: 'hero',
  device_class: 'high',
  samples: MIN_SAMPLES,
  renders: 100,
  mounts: 30,
  slow_renders: 0,
  hist: hist(3, 100),
  min_ms: 4.5,
  max_ms: 7.5,
  ...overrides,
});

const versionRow = (overrides: Partial<DailyVersionRow>): DailyVersionRow => ({
  day: '2026-10-27',
  app_version: 'aaaaaaa',
  area_id: 'hero',
  samples: MIN_SAMPLES,
  renders: 100,
  mounts: 30,
  slow_renders: 0,
  hist: hist(3, 100),
  min_ms: 4.5,
  max_ms: 7.5,
  ...overrides,
});

const page = (
  day: string,
  device_class: DailyAreaRow['device_class'],
  page_views: number,
  long_tasks = 0,
  long_frames = 0
) => ({ day, device_class, page_views, long_tasks, long_frames });

describe('buildStats', () => {
  it('merges histograms across days and devices, and sorts areas slowest first', () => {
    const stats = buildStats({
      areas: [
        row({ area_id: 'hero' }),
        row({
          area_id: 'experience',
          device_class: 'low',
          slow_renders: 100,
          hist: hist(6, 100),
          min_ms: 17,
          max_ms: 23,
        }),
        row({ area_id: 'experience', device_class: 'high', day: '2026-10-28' }),
      ],
      pages: [
        page('2026-10-27', 'high', 10, 2, 3),
        page('2026-10-27', 'low', 5, 4, 1),
        page('2026-10-28', 'high', 5),
      ],
    });

    expect(stats.pageViews).toBe(20);
    expect(stats.longTasksPerView).toBe(0.3);
    expect(stats.longFramesPerView).toBe(0.2);
    expect(stats.areas.map((a) => a.id)).toEqual(['experience', 'hero']);
    const experience = stats.areas[0]!;
    expect(experience.mounts).toBe(60);
    // Half the renders are 4–8 ms and half 16–24 ms, so p75 falls in the slow half
    expect(experience.p50).toBeLessThanOrEqual(8);
    expect(experience.p75).toBeGreaterThan(16);
    expect(experience.slowShare).toBe(0.5);
    expect(experience.byDevice.low?.p75).toBeGreaterThan(16);
    expect(experience.byDevice.high?.p75).toBeLessThanOrEqual(8);
    expect(stats.devices[0]?.deviceClass).toBe('low');
    expect(stats.trend.map((d) => [d.day, d.pageViews])).toEqual([
      ['2026-10-27', 15],
      ['2026-10-28', 5],
    ]);
    expect(stats.range).toEqual({ from: '2026-10-27', to: '2026-10-28' });
  });

  it('hides areas with too few samples', () => {
    const stats = buildStats({
      areas: [row({ samples: MIN_SAMPLES - 1 })],
      pages: [],
    });
    expect(stats.areas).toEqual([]);
    expect(stats.hiddenAreas).toBe(1);
  });

  it('handles Postgres bigints returned as strings', () => {
    const stats = buildStats({
      areas: [
        row({ renders: '100', samples: '40', hist: hist(3, 100).map(String) }),
      ],
      pages: [],
      blocks: [{ area_id: 'hero', count: '3', total_ms: 240, max_ms: 120 }],
    });
    expect(stats.renders).toBe(100);
    expect(stats.areas[0]?.samples).toBe(40);
    expect(stats.blocks[0]?.count).toBe(3);
  });

  it('is empty without data, and the headline names the slowest area', () => {
    expect(buildStats({ areas: [], pages: [] })).toMatchObject({
      pageViews: 0,
      areas: [],
      range: null,
      p75: 0,
      blocks: [],
      worst: [],
      release: null,
    });
    expect(
      headline(buildStats({ areas: [row({})], pages: [] })).slowestArea?.id
    ).toBe('hero');
  });

  it('sorts blocks by blocked time, with null for outside React renders', () => {
    const stats = buildStats({
      areas: [],
      pages: [],
      blocks: [
        { area_id: 'hero', count: 2, total_ms: 130, max_ms: 70 },
        { area_id: '', count: 5, total_ms: 400, max_ms: 110 },
      ],
    });
    expect(stats.blocks.map((b) => b.area)).toEqual([null, 'hero']);
  });

  it('reports nested updates as updates, slowest first', () => {
    const stats = buildStats({
      areas: [],
      pages: [],
      worst: [
        {
          day: '2026-10-27',
          area_id: 'hero',
          device_class: 'low',
          phase: 'mount',
          ms: 40,
        },
        {
          day: '2026-10-28',
          area_id: 'experience',
          device_class: 'mid',
          phase: 'nested-update',
          ms: 55,
        },
      ],
    });
    expect(stats.worst.map((w) => [w.area, w.phase])).toEqual([
      ['experience', 'update'],
      ['hero', 'mount'],
    ]);
  });
});

describe('release comparison', () => {
  it('compares the latest release with enough data against the one before it', () => {
    const { release } = buildStats({
      areas: [],
      pages: [],
      versions: [
        // Older release: Experience renders in 16–24 ms
        versionRow({
          day: '2026-10-20',
          app_version: 'old1234',
          area_id: 'experience',
          hist: hist(6, 100),
          min_ms: 17,
          max_ms: 23,
        }),
        versionRow({ day: '2026-10-20', app_version: 'old1234' }),
        // Latest release: 4–8 ms
        versionRow({
          day: '2026-10-25',
          app_version: 'new5678',
          area_id: 'experience',
        }),
        versionRow({ day: '2026-10-25', app_version: 'new5678' }),
        // Newer still, but too little data to compare
        versionRow({ day: '2026-10-28', app_version: 'thin000', samples: 3 }),
        versionRow({ day: '2026-10-29', app_version: 'unknown' }),
      ],
    });

    expect(release?.current).toMatchObject({
      version: 'new5678',
      since: '2026-10-25',
    });
    expect(release?.previous.version).toBe('old1234');
    // Experience changed the most, so it comes first
    expect(release?.areas[0]?.id).toBe('experience');
    expect(release!.areas[0]!.current).toBeLessThan(
      release!.areas[0]!.previous
    );
  });

  it('is null until two releases have enough data', () => {
    const { release } = buildStats({
      areas: [],
      pages: [],
      versions: [versionRow({})],
    });
    expect(release).toBeNull();
  });
});
