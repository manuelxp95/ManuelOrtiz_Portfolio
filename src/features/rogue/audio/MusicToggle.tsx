import { setMuted, useMusicSettings } from "./music-settings";
import { musicEngine } from "./use-card-music";

/**
 * The speaker button: mutes or unmutes Card Mode's music (and its bounce), remembered on this
 * device. While the browser still holds the audio, pressing it starts the music instead.
 */
export function MusicToggle() {
  const { muted, blocked } = useMusicSettings();
  const on = !muted && !blocked;

  return (
    <button
      type="button"
      data-music-toggle
      aria-pressed={on}
      aria-label="Music"
      title={on ? "Mute music" : "Play music"}
      className="music-toggle"
      onClick={() => {
        // Only the engine sets `blocked`, so it has loaded by then.
        if (blocked) {
          musicEngine()?.startMusic();
        } else {
          setMuted(!muted);
        }
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 5 6 9H2v6h4l5 4z" />
        {on ? (
          <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
        ) : (
          <path d="m16 9 6 6m0-6-6 6" />
        )}
      </svg>
    </button>
  );
}
