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
- **Beat detection references** (2026-09-29): offline trackers — madmom (RNN + DBN, most accurate
  in comparisons), beat_this (CPJKU transformer, ISMIR 2024, beats and downbeats without a DBN),
  librosa `beat_track` (Ellis DP; best at global tempo, beats ~20–60 ms late), Essentia
  `RhythmExtractor2013`, BeatNet (online, particle filter). Browser: `web-audio-beat-detector` and
  `realtime-bpm-analyzer` give one BPM (+ offset) per track — no drift. beat_this and librosa served
  as references here (run locally, never shipped); the tracker itself is ported into the script
  with no dependency.
- **Beat sync:** rhythm games follow the audio clock against a precomputed beat map instead of
  analysing audio live (an `AnalyserNode` costs CPU every frame and reacts late). Output latency
  (`AudioContext.outputLatency`) is subtracted so the bounce matches what is heard.
- **Autoplay:** browsers hold audio until the visitor interacts with the page. A switch into Card
  Mode is such an interaction; a page that loads straight into Card Mode is not.

## Decision

- **Asset:** `npm run audio:music` (`scripts/audio/music.mts`, needs `ffmpeg`) re-encodes the
  owner's track (git-ignored `resources/`) to `public/audio/midnight-pixel-garden.mp3` (128 kbps,
  no cover art or tags: 4.2 MB → 2.8 MB), fetched only when Card Mode mounts.
- **Beat map at build time — beat tracking, not onset picking** (revised 2026-09-29, owner review:
  "at times far too sensitive, at others it doesn't move with the beat at all"). The first map
  picked kick onsets (150 Hz low band, peaks over a moving average, gated at 55 % of the hardest
  hit). Checked against two reference trackers, a third of its hits fell between beats (8th-note
  bass and fills 230 ms apart: too sensitive) and the gate left ten gaps of 3–13 s (no bounce).
  Onsets are not beats. The script now runs a beat tracker over the encoded file (the one browsers
  play): spectral flux of the log magnitude (1024-sample FFT, 11.6 ms hop, every frequency votes,
  so the beat carries through bars without kick) → tempo from its autocorrelation under a
  log-normal prior around 120 BPM → Ellis' dynamic-programming tracker (as in librosa, tightness
  100), which places one beat per period and lets the period follow the music. Each beat then
  snaps onto a kick found within ±40 ms (2.9 ms hop), since the thud is what the eye matches.
  Strength: 1 no kick (breakdowns bounce softly instead of freezing), 2 a kick, 3 a kick at 80 %+
  of the typical (90th-percentile) kick. Result: 396 beats (84/187/125); 388 of the 392 beats
  from beat_this (CPJKU, ISMIR 2024) lie within 50 ms (median 12 ms), as do 349/393 of librosa's.
  Committed as `audio/beats.generated.ts`.
- **Why not one tempo:** both reference trackers show the tempo rising steadily from ~127 BPM to
  ~130 BPM across the track (4/4 throughout), so a single BPM grid drifts up to ±300 ms off the
  music. The tracked map *is* the tempo approach, with a tempo that is allowed to drift. The loop
  seam is not beat-exact (the last beat to the first is 326 ms, not ~465).
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
- Onset peak picking (the first beat map) — onsets are not beats: too many between beats, none in
  quiet passages.
- Shipping madmom/beat_this output — Python/PyTorch as a build dependency for a 2 kB map; they stay
  reference tools.
- An `AudioBuffer` loop (sample-exact, gapless) — ~60 MB of memory for a background track.

## Consequences

Card Mode load 79.8 kB gz (+0.8 kB: toggle, settings, hook), 0.2 kB under the 80 kB budget; the
engine and beat map are a separate 2.8 kB gz chunk (2.4 kB with the first, onset-picked map); the track is 2.8 MB, fetched only in Card Mode.
Like the combatant models, the source track is git-ignored, so CI cannot regenerate the beat map;
`npm run audio:music -- --check` verifies it locally. MP3 encoder padding can leave a very short
gap at the loop point of `<audio loop>`. The track is AI-generated from the owner's own prompts: no
third-party author, so Card Mode shows no credit for it (unlike the CC BY models); the generating
service's terms decide who may publish it.
