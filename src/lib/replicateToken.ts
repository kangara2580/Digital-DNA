/**
 * Replicate API 토큰 (서버 전용).
 *
 * 우선순위: REPLICATE_API_TOKEN → REPLICATE_TOKEN
 * 공백만 있는 값은 무시합니다.
 *
 * 주의: `.env.local`에 `REPLICATE_API_TOKEN=""` 처럼 빈 문자열을 두면
 * Next.js가 `.env` 등 다른 파일에 있는 동일 변수까지 덮어씌워 토큰이 비게 됩니다.
 * 사용하지 않을 때는 해당 줄을 삭제하세요.
 */
export function getReplicateApiToken(): string | null {
  const a = process.env.REPLICATE_API_TOKEN?.trim();
  const b = process.env.REPLICATE_TOKEN?.trim();
  if (a) return a;
  if (b) return b;
  return null;
}
