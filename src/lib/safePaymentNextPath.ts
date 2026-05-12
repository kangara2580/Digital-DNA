/**
 * Toss 결제 성공 후 내부 리다이렉트용 경로 — 오픈 리다이렉트 방지.
 * 허용: `/purchase/complete/{videoId}` 한 종류만.
 */
export function buildPurchaseCompleteNextPath(videoId: string): string {
  const id = encodeURIComponent(videoId.trim());
  return `/purchase/complete/${id}`;
}

export function parseSafePaymentNextParam(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null;
  let path = raw.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return null;
  }
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (path.includes("://") || path.includes("..")) return null;
  if (!path.startsWith("/purchase/complete/")) return null;
  const rest = path.slice("/purchase/complete/".length);
  if (!rest || rest.includes("/") || rest.includes("?")) return null;
  return `/purchase/complete/${rest}`;
}

/** `parseSafePaymentNextParam` 결과에서 videoId 추출 */
export function videoIdFromPurchaseCompletePath(path: string): string | null {
  const prefix = "/purchase/complete/";
  if (!path.startsWith(prefix)) return null;
  const raw = path.slice(prefix.length);
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}
