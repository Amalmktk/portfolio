import type { IconType } from 'react-icons';
import {
  SiCss,
  SiGit,
  SiHtml5,
  SiJavascript,
  SiJest,
  SiNestjs,
  SiNextdotjs,
  SiNodedotjs,
  SiNpm,
  SiReact,
  SiRecoil,
  SiRedux,
  SiTailwindcss,
  SiTypescript,
  SiWebpack,
} from 'react-icons/si';

export interface Skill {
  name: string;
  icon: IconType;
  color: string;
}

// Official brand colours; Next.js is white instead of black for the dark theme
export const SKILLS: Skill[] = [
  { name: 'React', icon: SiReact, color: '#61DAFB' },
  { name: 'JavaScript', icon: SiJavascript, color: '#F7DF1E' },
  { name: 'TypeScript', icon: SiTypescript, color: '#3178C6' },
  { name: 'Node.js', icon: SiNodedotjs, color: '#5FA04E' },
  { name: 'NestJS', icon: SiNestjs, color: '#E0234E' },
  { name: 'Next.js', icon: SiNextdotjs, color: '#FFFFFF' },
  { name: 'Recoil', icon: SiRecoil, color: '#3578E5' },
  { name: 'Webpack', icon: SiWebpack, color: '#8DD6F9' },
  { name: 'Redux', icon: SiRedux, color: '#764ABC' },
  { name: 'Tailwind CSS', icon: SiTailwindcss, color: '#06B6D4' },
  { name: 'HTML', icon: SiHtml5, color: '#E34F26' },
  { name: 'CSS', icon: SiCss, color: '#663399' },
  { name: 'npm', icon: SiNpm, color: '#CB3837' },
  { name: 'Jest', icon: SiJest, color: '#C21325' },
  { name: 'Git', icon: SiGit, color: '#F05032' },
];
