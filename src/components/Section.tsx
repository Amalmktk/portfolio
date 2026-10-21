import type { ReactNode } from 'react';

interface SectionProps {
  id: string;
  children: ReactNode;
  className?: string;
}

// Page section shell: anchor id, header offset for scrolling, centred content column
const Section = ({ id, children, className = '' }: SectionProps) => {
  return (
    <section
      id={id}
      className={`w-full scroll-mt-16 px-6 py-24 md:py-32 ${className}`}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-12">
        {children}
      </div>
    </section>
  );
};

export default Section;
