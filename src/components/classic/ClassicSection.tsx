import type { ReactNode } from "react";
import { sections } from "@/domain/sections";
import type { SectionId } from "@/domain/types";

interface ClassicSectionProps {
  id: Exclude<SectionId, "about">;
  children: ReactNode;
}

/** Section landmark titled from the registry, so labels never drift between modes. */
export function ClassicSection({ id, children }: ClassicSectionProps) {
  const label = sections.find((section) => section.id === id)?.classicLabel;
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="border-t border-border py-12"
    >
      <h2
        id={`${id}-heading`}
        tabIndex={-1}
        className="mb-6 text-2xl font-semibold"
      >
        {label}
      </h2>
      {children}
    </section>
  );
}
