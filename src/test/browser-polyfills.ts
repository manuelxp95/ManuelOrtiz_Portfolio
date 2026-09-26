/**
 * Minimal stand-ins for browser APIs jsdom lacks. They model only the behavior the app relies on;
 * the real behavior is verified in Chrome (see docs/perf-baseline.md → verification notes).
 */

let reducedMotion = false;

/** `window.matchMedia` answering only prefers-reduced-motion. */
export function installMatchMedia() {
  window.matchMedia = (query: string) =>
    ({
      matches: query.includes("prefers-reduced-motion") && reducedMotion,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

export function setReducedMotion(value: boolean) {
  reducedMotion = value;
}

const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]";

/** Modal <dialog>: open attribute, initial focus, Escape → cancel event, close(). */
export function installDialog() {
  const proto = HTMLDialogElement.prototype;
  proto.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
    this.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  };
  proto.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const dialog = document.querySelector<HTMLDialogElement>("dialog[open]");
    if (!dialog) return;
    const cancel = new Event("cancel", { cancelable: true });
    if (dialog.dispatchEvent(cancel)) dialog.close();
  });
}
