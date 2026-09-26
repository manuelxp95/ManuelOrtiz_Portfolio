import { employmentLabels, experience, projects } from "@/content";
import { formatYearRange } from "@/domain/dates";
import { TagList } from "./TagList";

export function ExperienceBody() {
  return (
    <ol className="space-y-10">
      {experience.map((entry) => {
        const relatedProjects = projects.filter((project) =>
          entry.projectIds.includes(project.id),
        );
        return (
          <li key={entry.id}>
            <article aria-labelledby={`experience-${entry.id}`}>
              <h3
                id={`experience-${entry.id}`}
                className="text-lg font-semibold"
              >
                {entry.role}{" "}
                <span className="font-normal text-muted">
                  · {entry.organization}
                </span>
              </h3>
              <p className="mt-1 text-sm text-muted">
                {[
                  employmentLabels[entry.employment],
                  entry.location,
                  formatYearRange(entry.startYear, entry.endYear),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="mt-3 leading-relaxed">{entry.summary}</p>
              {entry.highlights.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 leading-relaxed">
                  {entry.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              )}
              {relatedProjects.length > 0 && (
                <p className="mt-3 text-sm">
                  Project:{" "}
                  {relatedProjects.map((project) => (
                    <a
                      key={project.id}
                      href={`#project-${project.id}`}
                      className="text-accent underline underline-offset-2"
                    >
                      {project.name}
                    </a>
                  ))}
                </p>
              )}
              <div className="mt-3">
                <TagList label={`${entry.role} stack`} tags={entry.stack} />
              </div>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
