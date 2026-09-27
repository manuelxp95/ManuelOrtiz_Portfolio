import Image from "next/image";
import { projectContextLabels } from "@/content";
import type { Project } from "@/domain/types";
import { TagList } from "./TagList";

/** Project blocks shared by the Classic project card and the Card Mode relic detail. */

export function projectMeta(project: Project): string {
  return [projectContextLabels[project.context], project.year]
    .filter(Boolean)
    .join(" · ");
}

export function hasProjectExtras(project: Project): boolean {
  return (
    project.description !== project.summary ||
    project.role !== undefined ||
    project.responsibilities.length > 0 ||
    project.media.length > 0
  );
}

export function ProjectSummary({ project }: { project: Project }) {
  return (
    <>
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
    </>
  );
}

interface ProjectExtrasProps {
  project: Project;
  /** `sizes` for the gallery images, matching the width they render at. */
  mediaSizes: string;
}

export function ProjectExtras({ project, mediaSizes }: ProjectExtrasProps) {
  return (
    <div className="space-y-3 text-sm leading-relaxed">
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
                sizes={mediaSizes}
                className="aspect-video w-full rounded-control object-cover"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProjectLinks({ project }: { project: Project }) {
  if (project.links.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
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
  );
}
