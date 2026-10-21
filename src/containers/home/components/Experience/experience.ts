export interface Role {
  title: string;
  start: string;
  end: string;
}

export interface Job {
  company: string;
  location: string;
  // Most recent role first; more than one role shows a promotion timeline
  roles: Role[];
  highlights: string[];
  tech: string[];
}

export const JOBS: Job[] = [
  {
    company: 'Electrifex Technologies',
    location: 'Kerala, India',
    roles: [{ title: 'Software Architect', start: 'May 2026', end: 'Present' }],
    // TODO: replace with your own highlights for this role
    highlights: [
      'Own the frontend architecture, setting the structure, conventions and patterns that let features scale across teams.',
      'Make technical decisions on frameworks, state management and build tooling, and review designs and code to keep quality consistent.',
    ],
    tech: [
      'React',
      'TypeScript',
      'JavaScript',
      'Python',
      'Redux',
      'Tailwind CSS',
    ],
  },
  {
    company: 'Litmus7',
    location: 'Kochi, India',
    roles: [
      {
        title: 'Technology Specialist',
        start: 'Nov 2025',
        end: 'May 2026',
      },
    ],
    highlights: [
      'Worked as the frontend technology specialist on React and Next.js applications built on a micro-frontend architecture.',
      'Guided teams on micro-frontend boundaries, shared patterns and code quality.',
    ],
    tech: ['React', 'Next.js', 'TypeScript', 'Micro-frontends'],
  },
  {
    company: 'KeyValue Software Systems',
    location: 'Kochi, India',
    roles: [
      {
        title: 'Associate Staff Software Engineer',
        start: 'Aug 2024',
        end: 'Nov 2025',
      },
      {
        title: 'Senior Software Engineer',
        start: 'Apr 2021',
        end: 'Aug 2024',
      },
      { title: 'Software Engineer', start: 'Jun 2019', end: 'Apr 2021' },
      {
        title: 'Associate Software Engineer',
        start: 'Aug 2017',
        end: 'Apr 2019',
      },
    ],
    highlights: [
      'Grew from Associate Software Engineer to Associate Staff Software Engineer over eight years, specialising in frontend.',
      'Built React and TypeScript applications for clients in taxation, e-commerce and healthcare, including customer-facing apps and admin dashboards.',
      'Led the design and implementation of complex features and contributed to architecture decisions.',
      'Mentored junior developers and ran code reviews to keep coding standards high.',
      'Profiled and optimised application performance, and built responsive interfaces across devices.',
    ],
    tech: [
      'React',
      'TypeScript',
      'JavaScript',
      'Redux',
      'Redux-Saga',
      'Recoil',
      'Next.js',
      'Node.js',
      'NestJS',
      'Micro-frontends',
      'Material UI',
      'shadcn/ui',
      'Tailwind CSS',
    ],
  },
];
