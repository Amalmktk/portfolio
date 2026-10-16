import type { IconType } from 'react-icons';
import { FaLinkedin } from 'react-icons/fa';
import { SiDevdotto, SiGithub, SiMedium, SiNpm } from 'react-icons/si';

// TODO: replace with your real email address
export const EMAIL = 'your.email@example.com';

export interface SocialLink {
  label: string;
  href: string;
  display: string;
  icon: IconType;
}

export const SOCIAL_LINKS: SocialLink[] = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/amal-m-948a3398/',
    display: 'linkedin.com/in/amal-m-948a3398',
    icon: FaLinkedin,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/Amalmktk',
    display: 'github.com/Amalmktk',
    icon: SiGithub,
  },
  {
    label: 'Medium',
    href: 'https://medium.com/@amalmktk',
    display: 'medium.com/@amalmktk',
    icon: SiMedium,
  },
  {
    label: 'dev.to',
    href: 'https://dev.to/amalmktk',
    display: 'dev.to/amalmktk',
    icon: SiDevdotto,
  },
  {
    label: 'npm',
    href: 'https://www.npmjs.com/~amalmktk',
    display: 'npmjs.com/~amalmktk',
    icon: SiNpm,
  },
];
