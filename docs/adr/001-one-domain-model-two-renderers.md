# ADR-001 — One domain model, two renderers

- **Status:** Accepted
- **Date:** 2026-09-26
- **Source:** Roadmap §6.1, CLAUDE.md rule 1

## Context

The portfolio has two presentation modes — Classic (SEO/recruiter-first) and Card Mode (`rogue`
internally). The legacy site kept content ad hoc inside page components, so any second renderer
would have duplicated professional copy.

## Decision

All portfolio content (about, skills, experience, projects, education, contact, cv) lives once in a
typed TypeScript content layer (`src/domain/`, `src/content/`). Classic and Card Mode are pure
consumers of it. Presentation metadata that Card Mode needs (`rarity`, `cardVariant`, icon
identifiers) sits beside the domain entries as plain identifiers — never styling values or JSX.

## Alternatives

- Per-mode content files — guarantees drift between modes.
- A CMS — operational overhead with no concrete need for a site this size.

## Consequences

- Professional copy can't diverge between modes; a content validation suite (Roadmap P1) guards it.
- Accepted coupling: presentation identifiers live in the content layer. Keep them identifiers so
  the content layer never becomes a theme file.
