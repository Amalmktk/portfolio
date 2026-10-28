import type { ReactNode } from 'react';
import Section from '@components/Section';
import SectionHeading from '@components/SectionHeading';
import type { DeviceClass, PerformanceStats } from '@/types/performance';
import { usePerformanceStats } from './usePerformanceStats';

const PACKAGE_URL = 'https://www.npmjs.com/package/react-render-pulse';
// One frame at 60 fps: renders slower than this can cause visible jank
const FRAME_MS = 16;

const DEVICE_LABELS: Record<DeviceClass, string> = {
  low: 'Low-end devices',
  mid: 'Mid-range devices',
  high: 'High-end devices',
  unknown: 'Device not reported',
};

const ms = (value: number) => `${value.toFixed(1)} ms`;
const percent = (rate: number) => `${(rate * 100).toFixed(1)}%`;
const compact = (value: number) =>
  value >= 10_000
    ? `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`
    : value.toLocaleString('en-US');
// Area ids are lowercase section names, e.g. "experience" → "Experience"
const label = (id: string) => id.charAt(0).toUpperCase() + id.slice(1);
const shortDate = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-6 backdrop-blur-sm">
    <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
    <div className="mt-5">{children}</div>
  </div>
);

const Stat = ({ title, value }: { title: string; value: string }) => (
  <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-5 backdrop-blur-sm">
    <p className="text-xs tracking-widest text-zinc-400 uppercase">{title}</p>
    <p className="mt-2 text-2xl font-semibold text-zinc-100">{value}</p>
  </div>
);

// One row per section, slowest first: a band from p50 to p95, a marker at p75,
// and a guide line at one frame (16 ms)
const SectionRanges = ({ areas }: { areas: PerformanceStats['areas'] }) => {
  const scale = Math.max(...areas.map((area) => area.p95), FRAME_MS) * 1.08;
  const at = (value: number) => `${(Math.min(value, scale) / scale) * 100}%`;
  return (
    <div>
      <ul className="flex flex-col gap-3">
        {areas.map((area) => (
          <li
            key={area.id}
            className="grid grid-cols-[6.5rem_1fr_4.5rem] items-center gap-3 text-sm"
            aria-label={`${label(area.id)}: p50 ${ms(area.p50)}, p75 ${ms(area.p75)}, p95 ${ms(area.p95)}`}
          >
            <span className="truncate text-zinc-300">{label(area.id)}</span>
            <span
              className="relative h-3 rounded-full bg-white/5"
              aria-hidden="true"
            >
              <span
                className="absolute inset-y-0 w-px bg-zinc-500"
                style={{ left: at(FRAME_MS) }}
              />
              <span
                className="absolute inset-y-0.5 rounded-full bg-green-400/30"
                style={{
                  left: at(area.p50),
                  width: `calc(${at(area.p95)} - ${at(area.p50)})`,
                }}
              />
              <span
                className="absolute inset-y-0 w-1 -translate-x-1/2 rounded-full bg-green-400"
                style={{ left: at(area.p75) }}
              />
            </span>
            <span className="text-right font-mono text-xs text-zinc-300 tabular-nums">
              {ms(area.p75)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
        <span>
          <span className="mr-1.5 inline-block h-2 w-4 rounded-full bg-green-400/30 align-middle" />
          p50 to p95
        </span>
        <span>
          <span className="mr-1.5 inline-block h-2.5 w-1 rounded-full bg-green-400 align-middle" />
          p75
        </span>
        <span>
          <span className="mr-1.5 inline-block h-2.5 w-px bg-zinc-500 align-middle" />
          16 ms (one frame)
        </span>
      </p>
    </div>
  );
};

// p75 per day as columns; each column's tooltip and label carry its values
const DailyTrend = ({ days }: { days: PerformanceStats['trend'] }) => {
  const max = Math.max(...days.map((day) => day.p75), 1);
  const first = days[0];
  const last = days[days.length - 1];
  return (
    <div>
      <ul
        className="flex h-28 items-end gap-0.5"
        aria-label="p75 render time by day"
      >
        {days.map((day) => {
          const text = `${shortDate(day.day)}: p75 ${ms(day.p75)}, ${day.pageViews} page views`;
          return (
            <li
              key={day.day}
              title={text}
              aria-label={text}
              className="flex h-full min-w-0 flex-1 items-end"
            >
              <span
                className="block w-full max-w-6 rounded-t bg-green-400 transition-colors hover:bg-green-300"
                style={{ height: `${Math.max((day.p75 / max) * 100, 3)}%` }}
              />
            </li>
          );
        })}
      </ul>
      {first && last && (
        <div className="mt-2 flex justify-between font-mono text-xs text-zinc-500">
          <span>{shortDate(first.day)}</span>
          <span>
            {shortDate(last.day)} · p75 {ms(last.p75)}
          </span>
        </div>
      )}
    </div>
  );
};

// p75 for each device class, so slower devices stand out
const Devices = ({ devices }: { devices: PerformanceStats['devices'] }) => {
  const max = Math.max(...devices.map((device) => device.p75), 1);
  return (
    <ul className="flex flex-col gap-3">
      {devices.map((device) => (
        <li
          key={device.deviceClass}
          className="grid grid-cols-[9rem_1fr_auto] items-center gap-3 text-sm"
        >
          <span className="text-zinc-300">
            {DEVICE_LABELS[device.deviceClass]}
          </span>
          <span className="h-2 rounded-r bg-white/5" aria-hidden="true">
            <span
              className="block h-full rounded-r bg-green-400"
              style={{ width: `${Math.max((device.p75 / max) * 100, 2)}%` }}
            />
          </span>
          <span className="font-mono text-xs text-zinc-300 tabular-nums">
            {ms(device.p75)}
            <span className="hidden text-zinc-500 sm:inline">
              {' '}
              · {compact(device.pageViews)} views
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
};

const Performance = () => {
  const stats = usePerformanceStats();

  // The section only appears once there's real data: nothing while loading,
  // before the first daily update, or if the stats can't be loaded
  if (stats.status !== 'ready' || stats.data.pageViews === 0) return null;

  const { data } = stats;
  const content = (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat title="Page views" value={compact(data.pageViews)} />
        <Stat title="p75 render" value={ms(data.p75)} />
        <Stat title="Slow renders" value={percent(data.slowShare)} />
        <Stat
          title="Long tasks / view"
          value={data.longTasksPerView.toFixed(2)}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Render time by section">
          {data.areas.length > 0 ? (
            <SectionRanges areas={data.areas} />
          ) : (
            <p className="text-sm text-zinc-400">
              Sections appear once each has {data.minSamples} measurements.
            </p>
          )}
          {data.areas.length > 0 && data.hiddenAreas > 0 && (
            <p className="mt-3 text-xs text-zinc-500">
              {data.hiddenAreas} more still collecting ({data.minSamples}{' '}
              measurements needed).
            </p>
          )}
        </Card>
        <Card title="p75 render time by day">
          <DailyTrend days={data.trend} />
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {data.devices.length > 0 && (
          <Card title="By device">
            <Devices devices={data.devices} />
          </Card>
        )}
        <Card title="How to read this">
          <ul className="flex flex-col gap-2 text-sm leading-relaxed text-zinc-400">
            <li>
              <span className="text-zinc-200">p50, p75, p95:</span> half, three
              in four, and 19 in 20 renders were faster than this.
            </li>
            <li>
              <span className="text-zinc-200">16 ms</span> is one frame at 60
              fps. Renders slower than that can cause visible jank.
            </li>
            <li>
              <span className="text-zinc-200">Long tasks</span> block the main
              thread for 50 ms or more, delaying clicks and scrolling.
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );

  return (
    <Section id="performance">
      <SectionHeading eyebrow="Live" title="How this page performs" />
      <p className="max-w-2xl text-center text-sm leading-relaxed text-zinc-400">
        {/* Pulsing "live" dot; holds still for reduced-motion users */}
        <span className="relative mr-2 inline-flex h-2 w-2 align-middle">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75 motion-reduce:hidden" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
        </span>
        Real render timings from visitors' devices, measured by{' '}
        <a
          href={PACKAGE_URL}
          target="_blank"
          rel="noreferrer"
          className="text-green-300 underline-offset-4 hover:underline focus:outline-none focus-visible:underline"
        >
          react-render-pulse
        </a>
        , my open-source package. Updated daily, last 30 days.
      </p>
      <div className="w-full">{content}</div>
      <p className="max-w-2xl text-center text-xs text-zinc-500">
        Anonymous: no cookies, IP addresses or personal data are stored, and raw
        measurements are deleted after 30 days.
      </p>
    </Section>
  );
};

export default Performance;
