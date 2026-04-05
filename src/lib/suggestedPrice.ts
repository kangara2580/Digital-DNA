/**
 * 현재가 대비 20~30% 인하를 제안합니다. 100원 단위로 반올림하고 최소 100원·현재가 미만을 보장합니다.
 * 동일 영상·일자에 대해 결정적(deterministic)이라 배치가 매일 중복 실행돼도 같은 제안가를 유지합니다.
 */
export function computeSuggestedPriceKrw(
  current: number,
  videoId: string,
  dayKey: string,
): number {
  if (current <= 100) return 100;
  let h = 0;
  const s = `${videoId}:${dayKey}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const t = (h % 1000) / 1000;
  const discount = 0.2 + t * 0.1;
  const raw = Math.round((current * (1 - discount)) / 100) * 100;
  let next = Math.max(100, raw);
  if (next >= current) next = Math.max(100, current - 100);
  return next;
}

/** 배치 실행일(UTC 기준 YYYY-MM-DD) — 제안가 안정화용 */
export function utcDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}
