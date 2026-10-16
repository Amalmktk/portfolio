import type { CSSProperties } from 'react';
import type { IconType } from 'react-icons';

interface SkillBadgeProps {
  name: string;
  icon: IconType;
  color: string;
  visible?: boolean;
  delayMs?: number;
}

// Brand-coloured logo tile; glows in the brand colour on hover
const SkillBadge = ({
  name,
  icon: Icon,
  color,
  visible = true,
  delayMs = 0,
}: SkillBadgeProps) => {
  return (
    <li
      style={
        { '--brand': color, transitionDelay: `${delayMs}ms` } as CSSProperties
      }
      className={`group flex flex-col items-center gap-3 transition-all duration-500 ease-out motion-reduce:transition-none ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-(--brand) group-hover:shadow-[0_0_24px_-6px_var(--brand)]">
        <Icon
          className="h-10 w-10 transition-transform duration-300 group-hover:scale-110"
          style={{ color }}
          aria-hidden="true"
        />
      </div>
      <span className="text-sm text-zinc-400 transition-colors duration-300 group-hover:text-zinc-100">
        {name}
      </span>
    </li>
  );
};

export default SkillBadge;
