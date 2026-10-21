import type { IconType } from 'react-icons';
import { LuFolderGit2, LuGithub, LuNewspaper, LuPackage } from 'react-icons/lu';
import { SiNpm } from 'react-icons/si';
import type { CardLink } from '@components/ProjectCard';

export interface Project {
  title: string;
  eyebrow: string;
  description: string;
  icon: IconType;
  tags: string[];
  links: CardLink[];
  install?: string;
}

export const PROJECTS: Project[] = [
  {
    title: 'react-query-filters',
    eyebrow: 'Open-source npm package',
    description:
      'A headless React hook that keeps search, filters, sorting and pagination in sync with the URL, so filtered views survive a reload and can be shared as a link.',
    icon: LuPackage,
    install: 'npm i react-query-filters',
    tags: ['React', 'TypeScript', 'Hooks', 'URL state'],
    links: [
      {
        label: 'npm',
        href: 'https://www.npmjs.com/package/react-query-filters',
        icon: SiNpm,
      },
      {
        label: 'GitHub',
        href: 'https://github.com/Amalmktk/react-query-filters',
        icon: LuGithub,
      },
      {
        label: 'Article',
        href: 'https://dev.to/amalmktk/react-query-filters-a-headless-react-hook-for-url-synced-search-filters-sorting-pagination-4ea1',
        icon: LuNewspaper,
      },
    ],
  },
  {
    title: 'This portfolio',
    eyebrow: 'Personal site',
    description:
      "The site you're on: an interactive SVG triangle mesh, scroll-aware navigation, and animations that respect reduced-motion settings.",
    icon: LuFolderGit2,
    tags: ['React 19', 'TypeScript', 'Vite', 'Tailwind CSS'],
    links: [
      {
        label: 'GitHub',
        href: 'https://github.com/Amalmktk/portfolio',
        icon: LuGithub,
      },
    ],
  },
];
