# ADR-018 — Card Mode intro and saved game (Roadmap P9.13)

- **Status:** Accepted — requested by the project owner (2026-10-04)
- **Date:** 2026-10-04
- **Source:** Owner direction: the first time Card Mode opens, a bug alert appears in the middle of
  the screen, then an alarm sounds; the warning expands and the game starts — first the bug, then
  the hero, then the deck, which deals the first hand — and once everything is there, the bug's
  and the hero's HP bars. Owner choices: "BUG DETECTED" (the hero is there to debug it); the alarm
  synthesized with Web Audio; ~4 s; the intro once per device, and every later entry continues the
  game where it was left; a reset button at the top restarts the game and replays the intro; the
  Card Mode load budget is raised.

## Decision

- **Timeline** (`CardIntro.tsx` constants, the same clock in `rogue.css`): alert 0–1.2 s, the alert
  bursting open to 1.6 s, the bug glitching in at 1.6 s, the hero at 2.0 s, the deck at 2.4 s, the
  opening hand flying from the deck from 2.6 s (the existing `DrawnCard` with a later start), HP
  bars, statuses, intent and turn bar at 3.5 s, done at 3.9 s. The board carries `data-intro`
  (`alert` | `assemble`) while it runs; every entrance is a CSS animation on it (transform and
  opacity, plus an HP fill on `scale`). The beat bounce is off during the intro (same elements'
  `animation`). No new dependency, no idle loop.
- **Skip:** "Skip intro" (a real button), Escape, or a press anywhere ends it at once: every
  animation in the board finishes (`getAnimations({ subtree: true })`, so the deal's WAAPI flights
  land too) and `data-intro` is removed.
- **When:** the first Card Mode entry on a device (`card-mode-intro-seen` in `localStorage`, a
  per-visitor convenience like the mute). A direct section open (hash) or reduced motion skips it;
  either way the first entry marks it seen. The alert is a `role="alert"`: announced, not required.
- **Alarm** (`music-engine.ts`): the first sound effect, so ADR-016's growth path lands — an
  effects bus (gain 0.1) beside the music bus. Three 620→1080→620 Hz sawtooth sweeps through a
  low-pass, ~1.2 s, scheduled on the audio clock. Silent when muted or the tab is hidden; dropped
  (not delayed) when the browser still holds the audio, so it never sounds late. No asset; the
  engine chunk grows a few hundred bytes. No master gain yet: the music's mute path is unchanged.
- **Saved game** (`board-storage.ts`): deck, hand, read sections, combat and PRNG seed are written
  to `localStorage` (`card-mode-board`, versioned) whenever they change, and restored on mount.
  The card machine and the last hit are not saved: a restored board is idle and replays nothing; a
  pending or showing bug turn resolves as usual. A saved game from another version, or naming cards
  the content no longer has (or missing some), is dropped and a new one dealt. Zustand stays mode +
  active section; the game is not domain state and never blocks content.
- **Restart** (header, beside the music toggle): `NEW_GAME` deals a fresh board (read sections
  cleared, unlike "Play again"), the hand is re-dealt from the deck, and the intro replays (not
  under reduced motion). It waits while an intro is running (`aria-disabled`).

## Alternatives

- A recorded alarm file — another download for a 1 s effect; synthesis fits the terminal look.
- The intro on every entry, or every page load — a recruiter switching modes would sit through it
  again.
- The game kept only for the page's lifetime (module state) — the owner asked for the last game on
  every return.
- The intro in its own lazy chunk — its timeline would wait on a fetch; the overlay is a few hundred
  bytes.
- Saving the game in Zustand with `persist` — Zustand holds mode + active section only (ADR-003).

## Consequences

Card Mode load 81.0 kB gz (+1.1 kB: intro, saved game, restart); the budget moves from 80 to
85 kB (owner decision). All Card Mode chunks 113.9 kB of 120. A content change that renames a card
resets saved games once. Component tests clear storage per test; the intro, skip paths, restore and
restart are covered in `RogueBoard.test.tsx`, validation in `board-storage.test.ts`.
