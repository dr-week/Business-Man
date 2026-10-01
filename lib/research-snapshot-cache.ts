type Snapshot = { input: unknown; opportunities: unknown[]; runId: string | null };

let pending: { key: string; snapshot: Snapshot } | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let pageHideListening = false;

function onPageHide() {
  flushResearchSnapshot();
}

/** Coalesce rapid edits before writing the full offline snapshot synchronously. */
export function scheduleResearchSnapshot(key: string, snapshot: Snapshot, delayMs = 200) {
  pending = { key, snapshot };
  if (timer) clearTimeout(timer);
  timer = setTimeout(flushResearchSnapshot, delayMs);
  if (typeof window !== "undefined" && !pageHideListening) {
    window.addEventListener("pagehide", onPageHide);
    pageHideListening = true;
  }
}

export function flushResearchSnapshot(storage?: Pick<Storage, "setItem">) {
  if (timer) clearTimeout(timer);
  timer = undefined;
  if (!pending) return;
  const current = pending;
  pending = null;
  if (pageHideListening) {
    window.removeEventListener("pagehide", onPageHide);
    pageHideListening = false;
  }
  try { (storage ?? localStorage).setItem(current.key, JSON.stringify(current.snapshot)); } catch { /* Offline cache unavailable or full. */ }
}
