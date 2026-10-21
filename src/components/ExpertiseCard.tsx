import type { IconType } from 'react-icons';

interface ExpertiseCardProps {
  title: string;
  description: string;
  icon: IconType;
}

const ExpertiseCard = ({
  title,
  description,
  icon: Icon,
}: ExpertiseCardProps) => {
  return (
    <article className="group h-full rounded-xl border border-cyan-400/20 bg-zinc-950/40 px-6 py-5 backdrop-blur-sm transition-colors duration-300 hover:border-cyan-400/50">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-cyan-400/20 bg-cyan-400/10">
          <Icon
            className="h-4.5 w-4.5 text-cyan-400 transition-transform duration-300 group-hover:scale-115 group-hover:-rotate-6 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </div>
        <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
    </article>
  );
};

export default ExpertiseCard;
