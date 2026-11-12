import { SiDevdotto, SiMedium } from 'react-icons/si';
import type { CardLink } from '@components/ProjectCard';

export interface Post {
  title: string;
  summary: string;
  date: string;
  readTime?: string;
  tags: string[];
  links: CardLink[];
}

// Newest first
export const POSTS: Post[] = [
  {
    title:
      'I Pointed My React Performance Tool at My Own Portfolio. The First Problem It Found Was Mine.',
    summary:
      'What react-render-pulse showed on real visitors of this site, and how a header that looked slow turned out to be a measurement mistake.',
    date: 'Nov 2026',
    readTime: '8 min read',
    tags: ['React', 'Performance', 'Open source'],
    links: [
      {
        label: 'Medium',
        href: 'https://medium.com/@amalmktk/i-pointed-my-react-performance-tool-at-my-own-portfolio-the-first-problem-it-found-was-mine-494152650197',
        icon: SiMedium,
      },
    ],
  },
  {
    title: 'React Explained: Why It Still Wins After a Decade',
    summary:
      'What React is, how it works under the hood, and where it fits next to Angular, Vue and Svelte.',
    date: 'Oct 2026',
    tags: ['React', 'JavaScript'],
    links: [
      {
        label: 'Medium',
        href: 'https://medium.com/@amalmktk/react-explained-why-it-still-wins-after-a-decade-0e8560fdf075',
        icon: SiMedium,
      },
    ],
  },
  {
    title:
      'The Modern Frontend Developer: More Than Just HTML, CSS, and JavaScript',
    summary:
      'How the frontend role has grown well beyond HTML, CSS and a framework, and what teams now expect from frontend developers.',
    date: 'Sep 2026',
    tags: ['Frontend', 'Career'],
    links: [
      {
        label: 'Medium',
        href: 'https://medium.com/@amalmktk/the-modern-frontend-developer-more-than-just-html-css-and-javascript-2b4eeb39aa16',
        icon: SiMedium,
      },
    ],
  },
  {
    title:
      'Web Vitals in JavaScript: How to Measure, Debug, and Fix Real-World Performance Problems',
    summary:
      'Why a site that works can still feel slow, and how to measure, debug and fix Core Web Vitals in real projects.',
    date: 'Sep 2026',
    readTime: '12 min read',
    tags: ['Performance', 'Web Vitals'],
    links: [
      {
        label: 'Medium',
        href: 'https://medium.com/@amalmktk/web-vitals-in-javascript-how-to-measure-debug-and-fix-real-world-performance-problems-4cc4d2e8d11a',
        icon: SiMedium,
      },
      {
        label: 'dev.to',
        href: 'https://dev.to/amalmktk/web-vitals-in-javascript-how-to-measure-debug-and-fix-real-world-performance-problems-1l2d',
        icon: SiDevdotto,
      },
    ],
  },
  {
    title:
      'react-query-filters: A Headless React Hook for URL-Synced Search, Filters, Sorting & Pagination',
    summary:
      'Why I built a reusable hook for the search, filter, sort and pagination logic that every React project ends up needing.',
    date: 'Sep 2026',
    readTime: '2 min read',
    tags: ['React', 'TypeScript', 'Open source'],
    links: [
      {
        label: 'dev.to',
        href: 'https://dev.to/amalmktk/react-query-filters-a-headless-react-hook-for-url-synced-search-filters-sorting-pagination-4ea1',
        icon: SiDevdotto,
      },
    ],
  },
];
