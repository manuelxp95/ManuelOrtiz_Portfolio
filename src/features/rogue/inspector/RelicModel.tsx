import { lazy, Suspense, useState } from "react";
import type { AsciiShape } from "../ascii/renderer";

/**
 * User-triggered tier (ADR-007): the renderer and inspector load only when the button is pressed.
 * A failed load leaves a note instead of breaking the relic detail.
 */
const RelicInspector = lazy(() =>
  import("./RelicInspector").then(
    (module) => ({ default: module.RelicInspector }),
    () => ({
      default: () => (
        <p className="text-sm text-muted">The 3D view could not load.</p>
      ),
    }),
  ),
);

interface RelicModelProps {
  projectId: string;
  shape: AsciiShape;
  description: string;
}

/** "View relic in 3D" disclosure inside a relic's detail. */
export function RelicModel({ projectId, shape, description }: RelicModelProps) {
  const [shown, setShown] = useState(false);
  const regionId = `relic-${projectId}-model`;

  return (
    <div className="relic-model">
      <button
        type="button"
        aria-expanded={shown}
        aria-controls={regionId}
        onClick={() => setShown((value) => !value)}
        className="relic-model-toggle"
      >
        <span aria-hidden="true">[3D] </span>View relic in 3D
      </button>
      <div id={regionId}>
        {shown && (
          <Suspense
            fallback={
              <p className="font-mono text-sm text-muted">
                &gt; summoning relic_
              </p>
            }
          >
            <RelicInspector shape={shape} description={description} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
