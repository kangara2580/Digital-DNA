/** Supabase auth/REST — 일시적 네트워크·락 오류 (콘솔 Failed to fetch 완화) */
export function isTransientSupabaseFetchError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("failed to fetch")) return true;
    if (msg.includes("networkerror")) return true;
    if (msg.includes("network request failed")) return true;
    if (msg.includes("load failed")) return true;
    if (err.name === "AbortError") return true;
    if (msg.includes("lock") || msg.includes("steal")) return true;
  }
  if (typeof err === "object" && err !== null && "message" in err) {
    const msg = String((err as { message: unknown }).message).toLowerCase();
    if (msg.includes("failed to fetch")) return true;
  }
  return false;
}
