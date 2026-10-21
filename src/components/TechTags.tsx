interface TechTagsProps {
  tags: string[];
  className?: string;
}

const TechTags = ({ tags, className = '' }: TechTagsProps) => {
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 font-mono text-xs text-cyan-200"
        >
          {tag}
        </li>
      ))}
    </ul>
  );
};

export default TechTags;
