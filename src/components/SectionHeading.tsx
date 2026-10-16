interface SectionHeadingProps {
  title: string;
  eyebrow?: string;
}

const SectionHeading = ({ title, eyebrow }: SectionHeadingProps) => {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {eyebrow && (
        <span className="text-xs tracking-[0.3em] text-cyan-400 uppercase">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl font-bold md:text-4xl">{title}</h2>
      <div className="h-px w-24 bg-cyan-400/40" />
    </div>
  );
};

export default SectionHeading;
