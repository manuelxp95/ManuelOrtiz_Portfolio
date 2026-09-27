import Image from "next/image";
import type { Project } from "@/domain/types";
import {
  hasProjectExtras,
  ProjectExtras,
  ProjectLinks,
  projectMeta,
  ProjectSummary,
} from "./ProjectDetails";

export function ProjectCard({ project }: { project: Project }) {
  const headingId = `project-${project.id}-heading`;

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
          <p className="text-sm text-muted">{projectMeta(project)}</p>
        </div>
        <ProjectSummary project={project} />
        {hasProjectExtras(project) && (
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-accent">
              Details
            </summary>
            <div className="mt-3">
              <ProjectExtras
                project={project}
                mediaSizes="(min-width: 1024px) 240px, 50vw"
              />
            </div>
          </details>
        )}
        {project.links.length > 0 && (
          <div className="mt-auto pt-1">
            <ProjectLinks project={project} />
          </div>
        )}
      </div>
    </article>
  );
}
