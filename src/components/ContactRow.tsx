import type { ReactNode } from 'react';

interface ContactRowProps {
  label: string;
  value: string;
  href: string;
  external?: boolean;
  action?: ReactNode;
}

// Label on the left, linked value on the right; stacks on narrow screens
const ContactRow = ({
  label,
  value,
  href,
  external = false,
  action,
}: ContactRowProps) => {
  return (
    <li className="group flex flex-col gap-1 border-b border-white/10 py-4 transition-colors duration-300 last:border-b-0 hover:border-cyan-400/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm text-zinc-500">{label}</span>
      <div className="flex min-w-0 items-center gap-3">
        <a
          href={href}
          {...(external && { target: '_blank', rel: 'noreferrer' })}
          className="truncate text-zinc-100 transition-colors duration-300 group-hover:text-cyan-300 focus:outline-none focus-visible:text-cyan-300"
        >
          {value}
        </a>
        {action}
      </div>
    </li>
  );
};

export default ContactRow;
