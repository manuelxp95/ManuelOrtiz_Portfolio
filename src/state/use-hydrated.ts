import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False during SSR and hydration, true afterwards — without a setState-in-effect re-render. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
