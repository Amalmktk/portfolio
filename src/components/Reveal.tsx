import type { ReactNode } from 'react';
import { useInView } from '@hooks/useInView';

interface RevealProps {
  children: ReactNode;
  delayMs?: number;
  className?: string;
}

// Fades its content up the first time it scrolls into view
const Reveal = ({ children, delayMs = 0, className = '' }: RevealProps) => {
  const { ref, inView } = useInView<HTMLDivElement>(0.15);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        inView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Reveal;
