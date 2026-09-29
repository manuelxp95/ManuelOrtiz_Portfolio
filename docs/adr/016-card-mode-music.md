# ADR-016 — Card Mode background music and beat bounce (Roadmap P9.11)

- **Status:** Accepted — requested by the project owner (2026-09-28)
- **Date:** 2026-09-28
- **Source:** Owner direction: a faint looping track (`resources/SFX/midnight-pixel-garden_BK_loop.mp3`)
  under Card Mode; it resumes where it left off when Card Mode is re-entered; fades in and out; a
  speaker button mutes it; cards and combatants bounce lightly on its percussion; muting removes the
  bounce; the music steps back while the upgrade cards are on offer and returns once one is picked.
  "More sounds may be added later."

## Research

- **Libraries:** Howler.js (Web Audio with an HTML5 Audio fallback; fades, loop, sprites; ~10 kB gz)
  and Tone.js (a full synthesis/transport framework, far larger) solve more than this needs; the
  Card Mode load had 1.0 kB of headroom. Native Web Audio covers every requirement in ~2 kB.
- **Streaming vs. decoding:** a `MediaElementAudioSourceNode` streams the track through a gain
  graph; an `AudioBuffer` of the 3-minute track would hold ~60 MB of decoded samples.
- **Mixing:** games route sources into buses (`GainNode`s summed into a master) so music and
  effects mix, fade and mute independently; ducking is a gain ramp on the music bus only.
- **Beat sync:** rhythm games follow the audio clock against a precomputed beat map instead of
  analysing audio live (an `AnalyserNode` costs CPU every frame and reacts late). Output latency
  (`AudioContext.outputLatency`) is subtracted so the bounce matches what is heard.
- **Autoplay:** browsers hold audio until the visitor interacts with the page. A switch into Card
  Mode is such an interaction; a page that loads straight into Card Mode is not.

## Decision

- **Asset:** `npm run audio:music` (`scripts/audio/music.mts`, needs `ffmpeg`) re-encodes the
  owner's track (git-ignored `resources/`) to `public/audio/midnight-pixel-garden.mp3` (128 kbps,
  no cover art or tags: 4.2 MB → 2.8 MB), fetched only when Card Mode mounts.
- **Beat map at build time:** the same script decodes the encoded file (the one browsers play),
  low-passes it at 150 Hz (the kick drum), takes the rise of the band's log energy per 11.6 ms hop
  as the onset curve and keeps the peaks standing 0.32 above their moving average, at least 200 ms
  apart (the bounce's length), that also reach 55 % of the track's hardest hit — without that gate
  quiet passages bounced on kicks nobody hears (owner review, same day: 305 → 158 hits). Strength
  1–3 spreads the hits between the gate and the hardest (92/54/12), and the bounce scales with it.
  Committed as `audio/beats.generated.ts`. A fixed tempo grid was tried and dropped: the track's tempo wanders (~128.8–129.8 BPM),
  so any grid drifts off the beat within a minute. Breakdowns without kick have no hits, so the
  board rests there.
- **Engine** (`audio/music-engine.ts`, its own chunk with the beat map, loaded when the board
  mounts): `<audio loop>` → fade gain → duck gain → music bus (0.28, faint) → speakers. Entering
  fades in over 1.5 s; leaving, muting and hiding the tab fade out over 0.8 s and then **pause** the
  element, so the next visit continues from the same position (for the page's lifetime).
  Upgrade offer: duck to 40 % over 0.5 s, back over 1 s.
- **Bounce:** a timer follows `audio.currentTime` (minus output latency) to the next hit and
  alternates `data-beat="a|b"` on the board, with `--beat-strength`; CSS switches between two
  identical keyframes, which restarts the animation. Each hit is a **heartbeat** (owner follow-up,
  same day): a quick swell, a slight contraction below rest, then rest, 300 ms. Hand cards hop up
  to 4 px while they swell up to 3.5 % and contract 1.2 %; combatants swell up to 4.5 % from their
  feet and land with a 3 % squash. Harder hits beat bigger. All on the individual
  `translate`/`scale` properties so they add to the fan's and Motion's transforms. No per-frame
  JavaScript. It runs only while the music is heard: not muted,
  not blocked, tab visible; it is off under reduced motion (the music still plays: sound is not
  motion) and while a card's section is open to read. The lifted (inspecting) card does not bounce.
  **Second owner-approved exception** to "no continuous idle animation loops" (CLAUDE.md).
- **Mute toggle** (`audio/MusicToggle.tsx`, in the board header): a real button, `aria-label=
  "Music"`, `aria-pressed`, a speaker icon with waves or a cross, and a title that says what a
  click does. The choice is remembered on the device (`localStorage`, a per-viewer convenience).
  `audio/music-settings.ts` holds `muted` and `blocked` outside the lazy engine so the toggle
  renders at once; Zustand stays mode + active section only.
- **Autoplay held:** the engine marks the music `blocked` and starts it on the visitor's first
  pointer or key press anywhere. A press on the toggle itself starts the music rather than muting
  it (the toggle shows "off" while blocked).
- **Growth path for sound effects:** add an effects bus beside the music bus, both into one master
  gain that mute fades; short effects decode into `AudioBuffer`s (small, played many times). Not
  built until the first effect exists.
- **Accessibility:** WCAG 1.4.2 (audio control) — the toggle stops the music, and the music is
  faint by design; 2.2.2 (pause, stop, hide) — muting also stops the bounce.

## Alternatives

- Howler.js / use-sound — a dependency for features Web Audio has natively, over the budget.
- Live `AnalyserNode` beat detection — per-frame CPU, late reactions, and false hits from the bass.
- A fixed BPM grid (a CSS animation with a period) — drifts off a track whose tempo wanders.
- An `AudioBuffer` loop (sample-exact, gapless) — ~60 MB of memory for a background track.

## Consequences

Card Mode load 79.8 kB gz (+0.8 kB: toggle, settings, hook), 0.2 kB under the 80 kB budget; the
engine and beat map are a separate 2.4 kB gz chunk; the track is 2.8 MB, fetched only in Card Mode.
Like the combatant models, the source track is git-ignored, so CI cannot regenerate the beat map;
`npm run audio:music -- --check` verifies it locally. MP3 encoder padding can leave a very short
gap at the loop point of `<audio loop>`. The track is AI-generated from the owner's own prompts: no
third-party author, so Card Mode shows no credit for it (unlike the CC BY models); the generating
service's terms decide who may publish it.
