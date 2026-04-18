/**
 * 로그인 직후 항상 메인(/)으로 이동합니다.
 */
export function postLoginRedirectPath(_raw: string | null): string {
  return "/";
}
