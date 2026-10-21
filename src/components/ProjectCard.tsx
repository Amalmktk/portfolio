import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import TechTags from '@components/TechTags';

export interface CardLink {
  label: string;
  href: string;
  icon: IconType;
}

interface ProjectCardProps {
  title: string;
  description: string;
  icon: IconType;
  tags: string[];
  links: CardLink[];
  eyebrow?: string;
  children?: ReactNode;
}

const ProjectCard = ({
  title,
  description,
  icon: Icon,
  tags,
  links,
  eyebrow,
  children,
}: ProjectCardProps) => {
  return (
    <article className="group flex h-full flex-col rounded-xl border border-white/10 bg-zinc-950/40 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 motion-reduce:hover:translate-y-0">
      <div className="flex items-start justify-between gap-4">
        <Icon className="h-9 w-9 text-cyan-400" aria-hidden="true" />
        <ul className="flex items-center gap-4">
          {links.map(({ label, href, icon: LinkIcon }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                title={label}
                aria-label={`${title}: ${label} (opens in a new tab)`}
                className="block text-zinc-400 transition-colors duration-300 hover:text-cyan-300 focus:outline-none focus-visible:text-cyan-300"
              >
                <LinkIcon className="h-5 w-5" />
              </a>
            </li>
          ))}
        </ul>
      </div>
      {eyebrow && (
        <p className="mt-5 text-xs tracking-widest text-cyan-400 uppercase">
          {eyebrow}
        </p>
      )}
      <h3
        className={`${eyebrow ? 'mt-1' : 'mt-5'} text-xl font-semibold text-zinc-100 transition-colors duration-300 group-hover:text-cyan-300`}
      >
        {title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        {description}
      </p>
      {children}
      <TechTags tags={tags} className="mt-auto pt-6" />
    </article>
  );
};

export default ProjectCard;
