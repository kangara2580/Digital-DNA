/** 로그인·OAuth 완료 직후 랜딩 — 쇼핑몰에서 바로 영상 탐색 */
export const POST_LOGIN_REDIRECT_PATH = "/shop";

/**
 * 로그인 직후 항상 쇼핑몰({@link POST_LOGIN_REDIRECT_PATH})으로 이동합니다.
 */
export function postLoginRedirectPath(_raw: string | null): string {
  return POST_LOGIN_REDIRECT_PATH;
}
