import { lazy, Suspense, type ComponentType } from "react";
import type { SectionId } from "@/domain/types";
import { GenericSectionPanel } from "../GenericSectionPanel";

type PanelModule = { default: ComponentType };

/**
 * A lazily loaded panel. A failed load falls back to the generic panel: same content, plainer
 * layout.
 */
function lazyPanel(section: SectionId, load: () => Promise<PanelModule>) {
  return {
    load,
    Panel: lazy(() =>
      load().catch(() => ({
        default: () => <GenericSectionPanel section={section} />,
      })),
    ),
  };
}

/**
 * Differentiated panels (Roadmap P7), each its own interaction-tier chunk. Sections without one
 * keep the generic panel.
 */
const panels: Partial<Record<SectionId, ReturnType<typeof lazyPanel>>> = {
  projects: lazyPanel("projects", () =>
    import("./ProjectsPanel").then((module) => ({
      default: module.ProjectsPanel,
    })),
  ),
  experience: lazyPanel("experience", () =>
    import("./ExperiencePanel").then((module) => ({
      default: module.ExperiencePanel,
    })),
  ),
  contact: lazyPanel("contact", () =>
    import("./ContactPanel").then((module) => ({
      default: module.ContactPanel,
    })),
  ),
};

/** Intent tier: hovering or focusing a card warms its panel chunk before it opens. */
export function preloadSectionPanel(section: SectionId) {
  void panels[section]?.load().catch(() => {
    // The open itself retries and falls back to the generic panel.
  });
}

/** The expanded card's body; the generic panel stands in while a panel chunk loads. */
export function SectionPanel({ section }: { section: SectionId }) {
  const generic = <GenericSectionPanel section={section} />;
  const Panel = panels[section]?.Panel;
  if (!Panel) return generic;
  return (
    <Suspense fallback={generic}>
      <Panel />
    </Suspense>
  );
}
