import { useEffect, type RefObject } from "react";

/**
 * Dismisses UI (dropdowns, popovers, panels) when the user:
 * - clicks/taps outside the referenced element
 * - presses Escape
 * Cleanup runs automatically on unmount.
 */
export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  onDismiss: () => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const el = ref.current;
      if (!el) return;
      const target = event.target as Node;
      if (el.contains(target)) return;
      onDismiss();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }

    // pointerdown (not click) so it fires before the toggle's own click handler
    // re-opens the panel when clicking the trigger button.
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, onDismiss, enabled]);
}
