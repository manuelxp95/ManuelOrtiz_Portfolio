# ADR-009 — Duel: hero vs bug, card targets and aiming arrow (Roadmap P9.2)

- **Status:** Accepted — requested by the project owner (2026-09-27)
- **Date:** 2026-09-27
- **Source:** Owner direction: "when I drag a card it floats over the battlefield and an arrow runs
  from it to the enemy it damages; on the left a hero represents the player — me — as a placeholder
  to be replaced by a model; some cards affect the player instead, with the arrow pointing at him;
  the card activates when released over the field." Extends ADR-008.

## Decision

- **Duel layout:** the battlefield shows the hero on the left (the owner, "Manuel": ASCII
  placeholder, HP, status chips) and "The Legacy Bug" on the right. The hero art is a placeholder
  constant in `Battlefield.tsx`, to be replaced by ASCII frames converted from the owner's model
  (`assets/models/`, build-time, pending assets).
- **Card types and targets** (`cardActions` in `battle.ts`): ATTACK cards hit the bug —
  Experience 40, Projects 40, CV 20 (the attacks add up to its 100 HP); SKILL and POWER cards act
  on the hero and grant a status derived from the content — About "Ready", Skills "Str 36",
  Education "Block 6", Contact "Gold 4". The type is printed in each card's top border and in its
  accessible name ("attack card, hits The Legacy Bug").
- **Aiming arrow** (`TargetArrow.tsx`): while a card is dragged (mouse) a dashed curve runs from
  the floating card to its target — red for the bug, teal for the hero — and the target glows with
  a dashed frame. The target comes from the card, not from where it is dropped; releasing anywhere
  over the battlefield plays it. Touch has no drag (CLAUDE.md rule 6): a lifted card shows the same
  arrow and a second tap confirms. Pointer moves re-render only the arrow component.
- A dropped card now flies from where it was released to the battlefield before its effect.

## Alternatives

- Target chosen by drop position (hero or bug) — every card has one meaningful target, so a wrong
  drop would only add friction.
- Arrow on keyboard focus too — not requested; keyboard plays at once and the accessible name
  states the target.

## Consequences

Card Mode load 70.5 kB gz (+1.1 kB). Defeating the bug now takes the three attack cards; the four
hero cards build the hero's statuses. Fixed along the way: sibling React keys in the combatant
(art and effect layer shared `hit.count`) left a duplicate bug art after an attack.
