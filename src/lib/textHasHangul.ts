/** 한글 음절 범위(가–힣) — 후기 등 UGC에 한국어가 있는지 빠르게 검사 */
const HANGUL_RE = /[\uAC00-\uD7AF]/;

export function textHasHangul(text: string): boolean {
  return HANGUL_RE.test(text);
}
