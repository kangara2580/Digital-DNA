/** 판매 폼·API 공통 — 해시태그 문자열 정규화 */
export function normalizeSellHashtags(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  return t
    .split(/[\s,]+/)
    .map((x) => x.replace(/^#+/, "").trim())
    .filter(Boolean)
    .slice(0, 24)
    .map((x) => `#${x}`)
    .join(",");
}
