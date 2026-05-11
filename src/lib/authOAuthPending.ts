/**
 * Google OAuth 시작 → `/auth/callback` 복귀 직후까지 브라우저에 남기는 플래그.
 * - `DevAuthSessionReset`이 방금 받은 세션을 지우지 않도록
 * - `useAuthSession`이 쿠키 반영 지연 시 `getSession()`을 잠깐 재시도하도록
 */
const SESSION_STORAGE_KEY = "ara:auth:oauth_pending_ms";

export function markOAuthFlowStarted(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, String(Date.now()));
  } catch {
    /* private mode / quota */
  }
}

export function clearOAuthFlowPending(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* noop */
  }
}

/** OAuth 직후 수 분 안인지 — 오래된 값은 자동 제거 */
export function isOAuthFlowPending(maxAgeMs = 8 * 60 * 1000): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return false;
    const t = Number.parseInt(raw, 10);
    if (!Number.isFinite(t)) {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return false;
    }
    if (Date.now() - t > maxAgeMs) {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
