import { LuArrowUpRight } from 'react-icons/lu';
import TechTags from '@components/TechTags';
import type { CardLink } from '@components/ProjectCard';

interface PostCardProps {
  title: string;
  summary: string;
  date: string;
  readTime?: string;
  tags: string[];
  // First link is the primary one the title points to
  links: CardLink[];
}

const PostCard = ({
  title,
  summary,
  date,
  readTime,
  tags,
  links,
}: PostCardProps) => {
  const [primary] = links;

  return (
    <article className="group flex h-full flex-col rounded-xl border border-white/10 bg-zinc-950/40 p-6 backdrop-blur-sm transition-colors duration-300 hover:border-cyan-400/40">
      <div className="flex items-center justify-between gap-4 text-xs text-zinc-500">
        <span className="font-mono">
          {date}
          {readTime && ` · ${readTime}`}
        </span>
        <span className="flex items-center gap-2">
          {links.map(({ label, icon: Icon }) => (
            <Icon
              key={label}
              className="h-4 w-4 text-zinc-400"
              aria-hidden="true"
            />
          ))}
        </span>
      </div>
      <h3 className="mt-4 text-lg leading-snug font-semibold text-zinc-100">
        <a
          href={primary.href}
          target="_blank"
          rel="noreferrer"
          className="transition-colors duration-300 group-hover:text-cyan-300 focus:outline-none focus-visible:text-cyan-300"
        >
          {title}
        </a>
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{summary}</p>
      <TechTags tags={tags} className="mt-auto pt-6" />
      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {links.map(({ label, href }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-cyan-300 transition-colors hover:text-cyan-200 hover:underline focus:outline-none focus-visible:underline"
            >
              Read on {label}
              <LuArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
};

export default PostCard;
