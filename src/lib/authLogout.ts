import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

/** 로그아웃 후 이동할 홈(메인) 경로 */
export const AUTH_LOGOUT_HOME_PATH = "/";

/**
 * Supabase 세션 종료 후 홈 메인으로 이동합니다.
 * `router.replace`만으로는 마이페이지·스튜디오 등에서 UI가 남는 경우가 있어 전체 이동을 씁니다.
 */
export async function signOutAndNavigateHome(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      /* 네트워크 오류여도 홈으로 보냄 */
    }
  }

  if (typeof window === "undefined") return;

  const { pathname } = window.location;
  const onHome = pathname === AUTH_LOGOUT_HOME_PATH || pathname === "";

  if (onHome) {
    window.location.reload();
    return;
  }

  window.location.assign(AUTH_LOGOUT_HOME_PATH);
}
