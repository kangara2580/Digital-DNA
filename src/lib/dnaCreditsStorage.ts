const KEY = "reels-dna-credits";

export function readDnaCredits(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return 0;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function writeDnaCredits(next: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, String(Math.max(0, Math.floor(next))));
  window.dispatchEvent(new Event("reels-dna-credits-updated"));
}

export function addDnaCredits(delta: number) {
  writeDnaCredits(readDnaCredits() + delta);
}
