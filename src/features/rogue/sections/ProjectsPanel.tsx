import { m } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ProjectExtras,
  ProjectLinks,
  projectMeta,
  ProjectSummary,
} from "@/components/sections/ProjectDetails";
import { projects } from "@/content";
import { RELIC_MODELS } from "../ascii/scenes";
import { rarityLabels, rarityOf } from "../cards";
import { RelicModel } from "../inspector/RelicModel";
import { enter, layoutSpring, stagger, useEntrance } from "../motion-config";

/** `#project-<id>` (a Classic anchor, also linked from the quest path) opens that relic. */
function projectFromHash(): string | null {
  const id = window.location.hash.replace(/^#project-/, "");
  return projects.some((project) => project.id === id) ? id : null;
}

/**
 * Relic Collection (Roadmap P7): every project is a relic card; opening one widens it to the full
 * row with its detail, and the others slide to their new places. One relic is open at a time.
 * Accordion semantics: each relic is a heading wrapping a disclosure button.
 */
export function ProjectsPanel() {
  const [open, setOpen] = useState(projectFromHash);
  const deepLinked = useRef(open);
  const entrance = useEntrance({ opacity: 0, y: 12 });

  // A deep-linked relic takes focus: arriving from a quest-path link, the link itself is gone.
  useEffect(() => {
    if (!deepLinked.current) return;
    const relic = document.getElementById(`relic-${deepLinked.current}`);
    relic?.querySelector("button")?.focus({ preventScroll: true });
    relic?.scrollIntoView({ block: "nearest" });
  }, []);

  return (
    <div>
      <p className="font-mono text-sm text-muted">
        &gt; {projects.length} relics collected. Inspect one for its full
        record_
      </p>
      <ul aria-label="Projects" className="relic-grid">
        {projects.map((project, index) => {
          const expanded = open === project.id;
          const rarity = rarityOf(project);
          const detailId = `relic-${project.id}-detail`;
          const model = RELIC_MODELS[project.id];
          return (
            <m.li
              key={project.id}
              id={`relic-${project.id}`}
              layout="position"
              initial={entrance}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...stagger(index, 0.025), layout: layoutSpring }}
              data-expanded={expanded || undefined}
              data-rarity={rarity}
              className="relic-slot"
            >
              <h3>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={detailId}
                  onClick={() => setOpen(expanded ? null : project.id)}
                  className="relic-card"
                >
                  {project.thumbnail && (
                    <Image
                      src={project.thumbnail.src}
                      alt=""
                      width={project.thumbnail.width}
                      height={project.thumbnail.height}
                      sizes="(min-width: 40rem) 18rem, 45vw"
                      className="relic-art"
                    />
                  )}
                  <span className="relic-rarity">{rarityLabels[rarity]}</span>
                  <span className="relic-name">{project.name}</span>
                  <span className="relic-meta">{projectMeta(project)}</span>
                </button>
              </h3>
              <m.div
                id={detailId}
                hidden={!expanded}
                initial={false}
                animate={
                  expanded ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }
                }
                transition={enter}
                className="relic-detail"
              >
                <ProjectSummary project={project} />
                {model && (
                  <RelicModel
                    projectId={project.id}
                    shape={model.shape}
                    description={model.description}
                  />
                )}
                <ProjectExtras
                  project={project}
                  mediaSizes="(min-width: 40rem) 27rem, 45vw"
                />
                <ProjectLinks project={project} />
              </m.div>
            </m.li>
          );
        })}
      </ul>
    </div>
  );
}
