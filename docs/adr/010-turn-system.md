# ADR-010 — Turn system: the bug acts every two cards (Roadmap P9.3)

- **Status:** Accepted — requested by the project owner (2026-09-27)
- **Date:** 2026-09-27
- **Source:** Owner direction: "a turn system where, every 2 player actions, the BOSS takes its
  turn to attack / heal / build power (2× damage)". Extends ADR-008 and ADR-009.

## Decision

- **Turns:** the hero has 2 actions per turn; each card played from the hand (click, keyboard,
  tap, drop) is one. Direct opens (URL hash, back/forward) mark a card read but never touch the
  fight. After the second action the bug's turn is due; it acts only once the board is idle again
  (the dialog closed), shows its move for ~1.2 s, then turn N+1 starts. Playing a card while the
  bug's turn is due or showing resolves it at once — the game never makes the reader wait.
- **Bug:** 100 HP, a telegraphed cycle shown as its intent — attack 8 → charge (next attack ×2) →
  attack (16 if charged) → heal 12 → repeat.
- **Hero:** 50 HP. Card effects are now mechanics: Experience 5 hits × (4 + Str), Projects
  22 + Str, CV 15 + Str; Skills Strength +2 (stacks); About Dodge (the next attack misses);
  Education Block +6 (absorbs damage, consumed as it absorbs); Contact potion heals 12. Numbers
  derive from the content counts where they can.
- **Outcome:** bug at 0 → won; hero at 0 → lost. Either way a "Play again" button resets the fight
  (not what has been read), and every card still opens its section.
- **State:** `battle.ts` owns the fight (`Combat`, `BOSS_ACT` / `BOSS_DONE` / `RESET_BATTLE`) on
  top of the card machine; the board only schedules the bug's turn. Replaying a card counts again.
- **Accessibility:** the turn bar, the bug's intent ("Next move: …"), statuses and outcome are text;
  the live region states each card and each bug move with the resulting HP. Reduced motion keeps
  the timing but drops the lunge, shake and floating numbers' movement.

## Alternatives

- Random boss moves — less readable and harder to test; a fixed, announced cycle is the genre's
  "intent" convention.
- Boss acting over an open card — would interrupt reading; rejected by the portfolio rule.

## Consequences

Card Mode load 71.9 kB gz (+1.4 kB). A full fight takes about five turns.
