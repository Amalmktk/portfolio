import type { ReactNode } from 'react';
import Section from '@components/Section';
import SectionHeading from '@components/SectionHeading';
import { useInView } from '@hooks/useInView';
import type { PerformanceSummary } from '@/types/performance';
import { usePerformanceSummary } from './usePerformanceSummary';

const PACKAGE_URL = 'https://www.npmjs.com/package/react-render-pulse';

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

const Stat = ({ label: title, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-5 backdrop-blur-sm">
    <p className="text-xs tracking-widest text-zinc-400 uppercase">{title}</p>
    <p className="mt-2 text-2xl font-semibold text-zinc-100">{value}</p>
  </div>
);

// One horizontal bar per section: p75 render time, p95 alongside
const SectionBars = ({ areas }: { areas: PerformanceSummary['areas'] }) => {
  const max = Math.max(...areas.map((area) => area.p75), 1);
  return (
    <ul className="flex flex-col gap-3">
      {areas.map((area) => (
        <li
          key={area.id}
          className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 text-sm"
        >
          <span className="truncate text-zinc-300">{label(area.id)}</span>
          <span className="h-2 rounded-r bg-white/5" aria-hidden="true">
            <span
              className="block h-full rounded-r bg-green-400"
              style={{ width: `${Math.max((area.p75 / max) * 100, 2)}%` }}
            />
          </span>
          <span className="font-mono text-xs text-zinc-300 tabular-nums">
            {ms(area.p75)}
            {/* p95 only where there's room, so phones keep a readable bar */}
            <span className="hidden text-zinc-500 sm:inline">
              {' '}
              · p95 {ms(area.p95)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
};

// p75 per day as columns; each column's tooltip and label carry its values
const DailyTrend = ({ days }: { days: PerformanceSummary['byDay'] }) => {
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
          const text = `${shortDate(day.day)}: p75 ${ms(day.p75)}, ${day.sessions} sessions`;
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

const Devices = ({ devices }: { devices: PerformanceSummary['devices'] }) => (
  <ul className="flex flex-col divide-y divide-white/5 text-sm">
    {devices.map((device) => (
      <li
        key={device.device}
        className="flex items-center justify-between py-2"
      >
        {/* "? GB" means the browser doesn't report its memory */}
        <span className="text-zinc-300">
          {device.device.replace('? GB', 'Memory unknown')}
        </span>
        <span className="font-mono text-xs text-zinc-400 tabular-nums">
          p75 {ms(device.p75)} · {device.sessions} sessions
        </span>
      </li>
    ))}
  </ul>
);

const Message = ({ children }: { children: ReactNode }) => (
  <p className="py-16 text-center text-sm text-zinc-400">{children}</p>
);

const Performance = () => {
  const { ref, inView } = useInView<HTMLDivElement>(0.1);
  const summary = usePerformanceSummary(inView);

  let content: ReactNode;
  if (summary.status === 'loading') {
    content = <Message>Loading live data…</Message>;
  } else if (summary.status === 'error') {
    content = <Message>Live data isn't available right now.</Message>;
  } else if (summary.data.sessions === 0) {
    content = (
      <Message>Collecting the first measurements. Check back soon.</Message>
    );
  } else {
    const { data } = summary;
    content = (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Visits" value={compact(data.sessions)} />
          <Stat label="p75 render" value={ms(data.p75)} />
          <Stat label="Slow renders" value={percent(data.slowRate)} />
          <Stat
            label="Long tasks / visit"
            value={data.longTasksPerSession.toFixed(2)}
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card title="Render time by section (p75)">
            <SectionBars areas={data.areas} />
          </Card>
          <Card title={`p75 render time, last ${data.days} days`}>
            <DailyTrend days={data.byDay} />
          </Card>
        </div>
        {data.devices.length > 0 && (
          <Card title="By device (memory · CPU cores)">
            <Devices devices={data.devices} />
          </Card>
        )}
      </div>
    );
  }

  return (
    <Section id="performance">
      <SectionHeading eyebrow="Live" title="How this page performs" />
      <p className="max-w-2xl text-center text-sm leading-relaxed text-zinc-400">
        {/* Pulsing "live" dot; holds still for reduced-motion users */}
        <span className="relative mr-2 inline-flex h-2 w-2 align-middle">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75 motion-reduce:hidden" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
        </span>
        Real render timings from visitors' devices over the last 30 days,
        measured by{' '}
        <a
          href={PACKAGE_URL}
          target="_blank"
          rel="noreferrer"
          className="text-green-300 underline-offset-4 hover:underline focus:outline-none focus-visible:underline"
        >
          react-render-pulse
        </a>
        , my open-source package. Anonymous and cookie-free; refreshed every 15
        minutes.
      </p>
      <div ref={ref} className="w-full">
        {content}
      </div>
    </Section>
  );
};

export default Performance;
