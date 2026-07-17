import { useSyncExternalStore } from "react";

/**
 * Global "View as athlete" preview toggle. Lets a signed-in admin/coach see the
 * app exactly as an approved athlete would (no Edit toggles, no hidden items, no
 * Approvals link, video library gated by its flag). It's a client-only view
 * override — it does NOT change the user's real permissions, and any admin-only
 * write is still enforced server-side by RLS.
 *
 * Implemented as a tiny module-level store (not React context) because
 * `useProfile` is called independently in several components; a store lets every
 * one of them react to the toggle without threading a provider through the tree.
 */
let previewAthlete = false;
const listeners = new Set<() => void>();

export function setPreviewAthlete(v: boolean) {
  if (previewAthlete === v) return;
  previewAthlete = v;
  listeners.forEach((l) => l());
}

/** Subscribe to the preview toggle. Returns true while "View as athlete" is on. */
export function usePreviewAthlete(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => previewAthlete,
    () => previewAthlete
  );
}
