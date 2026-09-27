# ADR-011 — Deck: draw, cycle, project and skill cards (Roadmap P9.4)

- **Status:** Accepted — requested by the project owner; open points decided by him (2026-09-27)
- **Date:** 2026-09-27
- **Source:** Owner direction: "cards are drawn from the deck at the start, each used card goes back
  into the deck at a random position; the Projects card draws project cards from the deck; skill
  cards are upgrades for the player — hit harder, play more than 2 cards, or a shield." Owner
  choices: skill cards per skill category, a 5-card hand, project cards attack and open their
  project. Extends ADR-008 to ADR-010.

## Decision

- **Cards** (`src/features/rogue/cards.ts`): 7 section cards, 1 card per project (11), 1 upgrade
  card per skill category (9) — 27 in all. `CardId` = section id | `project:<id>` |
  `skill:<category>`; `sectionOf` gives the section a card opens.
- **Deck** (`battle.ts`): the opening hand is 5 cards dealt from the **section cards only** (the
  visitor first sees portfolio sections); the other 2 sections and every project and skill card are
  shuffled into the deck. Playing a card from the hand: its draw effect runs, the hand refills to
  5 from the top, and the played card goes back into the deck at a random position (hand capped at
  7). Shuffles use a seeded PRNG (mulberry32) held in the board state, so the reducer stays pure;
  each visit seeds it at random. "Play again" deals a fresh hand.
- **Section cards:** Projects and Skills become SKILL cards that draw 2 project / skill cards from
  the deck; the others keep their P9.3 effects.
- **Project cards:** ATTACK, damage by rarity (legendary 14, rare 10, common 6, + Strength); they
  open the Projects panel with that project's relic expanded (`#project-<id>`).
- **Skill cards:** POWER upgrades by category — Strength +2 (languages, backend, engines), +1 card
  this turn (frontend, practice, tools, AI), Shield: Block = 2 × the category's skills (testing,
  VR/AR). They open the Skills panel.
- **Content is never gated:** a section whose card is in the deck is always one click away in the
  site header, which opens its dialog in Card Mode as before; direct opens never touch the fight or
  the deck.
- **UI:** a "Deck N · Hand N" counter; the fan and its overlap follow the hand's size
  (`--hand-count`); after a play, focus returns to the card now in the played card's slot.

## Alternatives

- Dealing the opening hand from the whole deck — a first visit could show only project/skill
  cards and no sections.
- A discard pile — the owner asked for played cards to go back into the deck at random.

## Consequences

Card Mode load 73.0 kB gz (+1.1 kB). Component tests pin the deal with `src/test/card-deal.ts`
(all sections in hand); the random deal and the cycle are unit-tested with a fixed seed.
