import type { Ref } from "react";
import type { SectionMeta } from "@/domain/types";
import { cardGlyphs } from "./ascii/glyphs.generated";
import { buildCardFace } from "./card-face";

interface SectionCardProps {
  section: SectionMeta;
  stat: string;
  selected: boolean;
  onOpen: () => void;
  ref: Ref<HTMLButtonElement>;
}

/** A real button: click, Enter, Space and tap all open the card. The ASCII face is decorative. */
export function SectionCard({
  section,
  stat,
  selected,
  onOpen,
  ref,
}: SectionCardProps) {
  return (
    <button
      ref={ref}
      type="button"
      id={`card-${section.id}`}
      aria-current={selected ? "true" : undefined}
      aria-haspopup="dialog"
      onClick={onOpen}
      className="section-card"
    >
      <span className="sr-only">
        {section.classicLabel} — {section.cardLabel}. {stat}.
      </span>
      <span aria-hidden="true" className="card-face">
        {buildCardFace({
          title: section.cardLabel,
          glyph: cardGlyphs[section.id],
          label: section.classicLabel,
          stat,
          selected,
        })}
      </span>
    </button>
  );
}
