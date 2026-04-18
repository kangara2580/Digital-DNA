/**
 * 로그인 직후 이동 경로. 마이페이지 보호 구간에서 넘어온 `redirect=/mypage` 는
 * 의도적으로 홈으로 돌려 사용자가 메인에 머물도록 합니다.
 */
export function postLoginRedirectPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  if (raw === "/mypage" || raw.startsWith("/mypage/")) return "/";
  return raw;
}
