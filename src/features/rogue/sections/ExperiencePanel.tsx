import { m } from "motion/react";
import { useState } from "react";
import {
  experienceMeta,
  relatedProjects,
} from "@/components/sections/ExperienceBody";
import { TagList } from "@/components/sections/TagList";
import { experience } from "@/content";
import { enter, layoutSpring, stagger, useEntrance } from "../motion-config";

/**
 * Quest Map (Roadmap P7): the career as a CSS-drawn path of quest nodes, most recent first. A
 * semantic ordered list; each node is a heading wrapping a disclosure button, and any number can
 * be open. The ongoing role starts open. Reduced motion: no entrance, everything in place.
 */
export function ExperiencePanel() {
  const [open, setOpen] = useState(
    () =>
      new Set(
        experience
          .filter((entry) => entry.endYear === undefined)
          .map((entry) => entry.id),
      ),
  );
  const entrance = useEntrance({ opacity: 0, x: -12 });

  function toggle(id: string) {
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  return (
    <ol aria-label="Career path, most recent first" className="quest-path">
      {experience.map((entry, index) => {
        const expanded = open.has(entry.id);
        const current = entry.endYear === undefined;
        const detailId = `quest-${entry.id}-detail`;
        const related = relatedProjects(entry);
        return (
          <m.li
            key={entry.id}
            layout="position"
            initial={entrance}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...stagger(index, 0.05), layout: layoutSpring }}
            data-current={current || undefined}
            className="quest-node"
          >
            <span aria-hidden="true" className="quest-marker" />
            <h3>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={detailId}
                onClick={() => toggle(entry.id)}
                className="quest-toggle"
              >
                <span className="quest-status">
                  {current ? "Current quest" : "Quest complete"}
                </span>
                <span className="quest-role">{entry.role}</span>
                <span className="quest-org">{entry.organization}</span>
                <span className="quest-meta">{experienceMeta(entry)}</span>
              </button>
            </h3>
            <m.div
              id={detailId}
              hidden={!expanded}
              initial={false}
              animate={expanded ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
              transition={enter}
              className="quest-detail"
            >
              <p className="leading-relaxed">{entry.summary}</p>
              {entry.highlights.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 leading-relaxed">
                  {entry.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              )}
              {related.length > 0 && (
                <p className="text-sm">
                  Project:{" "}
                  {related.map((project) => (
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
              <TagList label={`${entry.role} stack`} tags={entry.stack} />
            </m.div>
          </m.li>
        );
      })}
    </ol>
  );
}
