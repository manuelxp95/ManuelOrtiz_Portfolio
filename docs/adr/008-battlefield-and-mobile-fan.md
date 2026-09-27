# ADR-008 — Battlefield board and a fanned hand on every screen (Roadmap P9.1)

- **Status:** Accepted — requested by the project owner after the P9 review (2026-09-27)
- **Date:** 2026-09-27
- **Source:** Owner feedback: "the mobile version doesn't reflect the spirit of the game — the
  cards must show as a fan in the hand, to be played on a combat stage where they act with
  different effects". Supersedes the P4 layout decision "desktop: arc/hand; mobile: grid or
  horizontal snap list" (Roadmap P4 task 2).

## Context

Card Mode rendered a fanned hand only from 64rem; phones got a two-column grid, and playing a
card just opened its dialog. The game metaphor stopped at the card faces.

## Decision

- **Game screen at every width:** header, battlefield and hand fill the viewport under the site
  header. The hand is a fan on phones too; the overlap is computed from the width
  (`margin-left: min(-1.5rem, (100% − 7 × card) / 6)`), card width is bounded by viewport width
  and height, and rotated edge cards are clipped at the board's sides.
- **Battlefield:** an original ASCII bug ("The Legacy Bug", 100 HP) and the drop target of the
  mouse drag. Each card deals fixed damage (the seven add up to 100) and has its own effect —
  summon, buff, combo, burst, runes, coins, scroll — whose tokens come from the content (skill
  names, experience years, contact channels…). All seven played: the bug is fixed.
- **Machine:** `inspecting` (touch-lifted card) and `playing` (effect running) join the card
  machine; `battle.ts` wraps it with game progress (played cards, last hit). Mouse click and
  Enter/Space play at once; a finger tap lifts the card first (cards overlap), and a second tap, a
  swipe up or a tap on the battlefield plays it. Effects last 0.9 s, then the dialog opens; a tap,
  Enter or Escape skips; reduced motion skips entirely. URL-hash and back/forward opens skip the
  effect but count as played.
- **Accessibility:** cards stay real buttons with the same names (plus "Played."); Left/Right move
  along the hand; the battlefield is decorative except a polite live region stating each hit.
  Touch never starts a drag (CLAUDE.md rule 6 still holds).

## Alternatives

- The open role as the rival (recruiting theme) or an arena without a rival — owner chose a
  technical bug.
- Content rendered on the battlefield instead of the dialog — more immersive, but it would rework
  the proven dialog focus/deep-link behavior; deferred.
- One tap plays on touch — too easy to hit the wrong card in an overlapping fan.

## Consequences

Card Mode load +2.4 kB gz (69.4 kB of 80). A played card reaches its content ~0.9 s later unless
skipped. The skeleton mirrors the new frame so the swap does not shift layout.
