import { useRef, useState, type KeyboardEvent } from 'react';
import Reveal from '@components/Reveal';
import Section from '@components/Section';
import SectionHeading from '@components/SectionHeading';
import TechTags from '@components/TechTags';
import { JOBS } from './experience';

// Tab size drives the sliding indicator: h-11 (2.75rem) tall, w-48 (12rem) wide on mobile
const TAB_HEIGHT_REM = 2.75;
const TAB_WIDTH_REM = 12;

const ARROW_STEPS: Record<string, number> = {
  ArrowDown: 1,
  ArrowRight: 1,
  ArrowUp: -1,
  ArrowLeft: -1,
};

const Experience = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const job = JOBS[activeIndex];
  const [currentRole] = job.roles;
  const firstRole = job.roles[job.roles.length - 1];

  const selectTab = (index: number) => {
    setActiveIndex(index);
    tabRefs.current[index]?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = ARROW_STEPS[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (activeIndex + step + JOBS.length) % JOBS.length;
    selectTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <Section id="experience">
      <SectionHeading title="Where I've worked" />
      <Reveal className="w-full max-w-3xl">
        <div className="flex w-full flex-col gap-8 md:flex-row">
          <div
            role="tablist"
            aria-label="Companies"
            onKeyDown={handleKeyDown}
            className="relative flex shrink-0 overflow-x-auto md:flex-col md:overflow-visible"
          >
            {JOBS.map((item, index) => {
              const selected = index === activeIndex;
              return (
                <button
                  key={item.company}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`experience-tab-${index}`}
                  aria-selected={selected}
                  aria-controls={`experience-panel-${index}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectTab(index)}
                  className={`h-11 w-48 shrink-0 cursor-pointer truncate border-b-2 border-white/10 px-5 text-left font-mono text-sm transition-colors duration-300 hover:bg-cyan-400/5 hover:text-cyan-300 focus:outline-none focus-visible:bg-cyan-400/10 md:w-auto md:border-b-0 md:border-l-2 ${
                    selected ? 'text-cyan-300' : 'text-zinc-400'
                  }`}
                >
                  {item.company}
                </button>
              );
            })}
            <span
              aria-hidden="true"
              className="absolute bottom-0 left-0 h-0.5 w-48 bg-cyan-400 transition-transform duration-300 ease-[cubic-bezier(0.645,0.045,0.355,1)] motion-reduce:transition-none md:hidden"
              style={{
                transform: `translateX(${activeIndex * TAB_WIDTH_REM}rem)`,
              }}
            />
            <span
              aria-hidden="true"
              className="absolute top-0 left-0 hidden h-11 w-0.5 bg-cyan-400 transition-transform duration-300 ease-[cubic-bezier(0.645,0.045,0.355,1)] motion-reduce:transition-none md:block"
              style={{
                transform: `translateY(${activeIndex * TAB_HEIGHT_REM}rem)`,
              }}
            />
          </div>

          <div
            key={job.company}
            role="tabpanel"
            id={`experience-panel-${activeIndex}`}
            aria-labelledby={`experience-tab-${activeIndex}`}
            className="animate-fade-in-up min-w-0 flex-1 motion-reduce:animate-none"
          >
            <h3 className="text-xl font-semibold text-zinc-100">
              {currentRole.title}{' '}
              <span className="text-cyan-300">@ {job.company}</span>
            </h3>
            <p className="mt-1 font-mono text-xs tracking-wide text-zinc-500">
              {firstRole.start} – {currentRole.end} · {job.location}
            </p>

            {job.roles.length > 1 && (
              <ol className="mt-5 space-y-2 border-l border-white/10 pl-4">
                {job.roles.map((role) => (
                  <li
                    key={role.title}
                    className="relative flex flex-wrap items-baseline gap-x-3 text-sm"
                  >
                    <span className="absolute top-1.5 -left-[21px] h-2 w-2 rounded-full bg-cyan-400/70" />
                    <span className="text-zinc-200">{role.title}</span>
                    <span className="font-mono text-xs text-zinc-500">
                      {role.start} – {role.end}
                    </span>
                  </li>
                ))}
              </ol>
            )}

            <ul className="mt-5 space-y-3">
              {job.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="relative pl-6 text-sm leading-relaxed text-zinc-400 before:absolute before:left-0 before:text-cyan-400 before:content-['▹']"
                >
                  {highlight}
                </li>
              ))}
            </ul>
            <TechTags tags={job.tech} className="mt-6" />
          </div>
        </div>
      </Reveal>
    </Section>
  );
};

export default Experience;
