import CopyButton from '@components/CopyButton';
import ProjectCard from '@components/ProjectCard';
import Reveal from '@components/Reveal';
import Section from '@components/Section';
import SectionHeading from '@components/SectionHeading';
import { PROJECTS } from './projects';

const STAGGER_MS = 100;

const Projects = () => {
  return (
    <Section id="projects">
      <SectionHeading title="Things I've built" />
      <ul className="grid w-full gap-6 md:grid-cols-2">
        {PROJECTS.map(({ install, ...project }, index) => (
          <li key={project.title}>
            <Reveal delayMs={index * STAGGER_MS} className="h-full">
              <ProjectCard {...project}>
                {install && (
                  <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 font-mono text-sm text-zinc-300">
                    <code className="truncate">
                      <span className="text-cyan-400 select-none">$ </span>
                      {install}
                    </code>
                    <CopyButton text={install} label="install command" />
                  </div>
                )}
              </ProjectCard>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
};

export default Projects;
