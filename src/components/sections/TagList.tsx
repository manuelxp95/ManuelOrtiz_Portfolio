interface TagListProps {
  label: string;
  tags: string[];
}

export function TagList({ label, tags }: TagListProps) {
  if (tags.length === 0) return null;
  return (
    <ul aria-label={label} className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-control border border-border bg-surface px-2 py-0.5 text-xs text-muted"
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}
