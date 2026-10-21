import type { IconType } from 'react-icons';
import {
  LuBoxes,
  LuFileJson,
  LuGauge,
  LuLayers,
  LuPlug,
  LuWorkflow,
} from 'react-icons/lu';

export interface ExpertiseItem {
  title: string;
  description: string;
  icon: IconType;
}

export const EXPERTISE_INTRO =
  "After 9+ years with React, I've found the hard part is rarely the framework. It's how the UI, state, data contracts and backend fit together, and that's where I focus.";

export const EXPERTISE: ExpertiseItem[] = [
  {
    title: 'Frontend Architecture',
    icon: LuLayers,
    description:
      'Structuring React and Next.js apps around features rather than file types, with clear module boundaries, shared conventions, and micro-frontends where teams need to ship independently.',
  },
  {
    title: 'UI for Complex Flows',
    icon: LuWorkflow,
    description:
      'Turning messy requirements into predictable UI states (empty, loading, success, error) and designing around the whole user flow, not single screens.',
  },
  {
    title: 'State Management',
    icon: LuBoxes,
    description:
      'Keeping one source of truth with Redux, Redux-Saga or Recoil, so components render state instead of inventing their own logic, and putting shareable state in the URL.',
  },
  {
    title: 'Type-Safe Contracts',
    icon: LuFileJson,
    description:
      'Starting from the shape of the data: TypeScript types and DTOs that the frontend and backend agree on, so mismatches surface at compile time rather than in production.',
  },
  {
    title: 'Backend Integration',
    icon: LuPlug,
    description:
      'Thinking in request → transform → render: handling async work, errors, caching, pagination and optimistic updates while keeping the UI honest about what the backend can do.',
  },
  {
    title: 'Performance & Reliability',
    icon: LuGauge,
    description:
      'Measuring before optimising: Core Web Vitals, profiling, bundle size, and defensive handling of API failures, so the app stays fast and stable for real users.',
  },
];
