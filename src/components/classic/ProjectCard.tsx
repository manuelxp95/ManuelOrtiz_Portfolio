import Image from "next/image";
import { projectContextLabels } from "@/content";
import type { Project } from "@/domain/types";
import { TagList } from "./TagList";

export function ProjectCard({ project }: { project: Project }) {
  const headingId = `project-${project.id}-heading`;
  const meta = [projectContextLabels[project.context], project.year]
    .filter(Boolean)
    .join(" · ");
  const hasDetails =
    project.description !== project.summary ||
    project.role !== undefined ||
    project.responsibilities.length > 0 ||
    project.media.length > 0;

  return (
    <article
      id={`project-${project.id}`}
      aria-labelledby={headingId}
      className="flex flex-col overflow-hidden rounded-card border border-border bg-surface"
    >
      {project.thumbnail && (
        <Image
          src={project.thumbnail.src}
          alt={project.thumbnail.alt}
          width={project.thumbnail.width}
          height={project.thumbnail.height}
          sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
          className="aspect-video w-full object-cover"
        />
      )}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h4 id={headingId} className="text-lg font-semibold">
            {project.name}
          </h4>
          <p className="text-sm text-muted">{meta}</p>
        </div>
        <p className="leading-relaxed">{project.summary}</p>
        {project.impact && (
          <p className="text-sm leading-relaxed">
            <span className="font-medium">Impact: </span>
            {project.impact}
          </p>
        )}
        <TagList
          label={`${project.name} stack`}
          tags={[...project.stack, ...project.genres]}
        />
        {project.platforms.length > 0 && (
          <p className="text-sm text-muted">
            Platforms: {project.platforms.join(", ")}
          </p>
        )}
        {hasDetails && (
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-accent">
              Details
            </summary>
            <div className="mt-3 space-y-3 text-sm leading-relaxed">
              <p>{project.description}</p>
              {project.role && (
                <p>
                  <span className="font-medium">Role: </span>
                  {project.role}
                </p>
              )}
              {project.responsibilities.length > 0 && (
                <ul className="list-disc space-y-1 pl-5">
                  {project.responsibilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {project.media.length > 0 && (
                <ul className="grid grid-cols-2 gap-2">
                  {project.media.map((media) => (
                    <li key={media.src}>
                      <Image
                        src={media.src}
                        alt={media.alt}
                        width={media.width}
                        height={media.height}
                        sizes="(min-width: 1024px) 240px, 50vw"
                        className="aspect-video w-full rounded-control object-cover"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </details>
        )}
        {project.links.length > 0 && (
          <ul className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-1 text-sm">
            {project.links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline underline-offset-2"
                >
                  {link.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
