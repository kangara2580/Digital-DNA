import type { Session, User } from "@supabase/supabase-js";

/**
 * 개발용 UI 로그인 시뮬레이션.
 * `.env.local`에 `NEXT_PUBLIC_DEV_AUTH_SIMULATE_LOGIN=1` 을 넣고 `npm run dev`로만 동작합니다.
 * (프로덕션 빌드에서는 `NODE_ENV=production` 이라 항상 꺼집니다.)
 *
 * 실제 Supabase JWT가 아니므로 API·RLS 호출은 실패할 수 있습니다.
 */
export function isAuthSimulateLoginEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_DEV_AUTH_SIMULATE_LOGIN === "1"
  );
}

const SIM_USER_ID = "00000000-0000-4000-8000-000000000001";

export function buildSimulatedAuthUser(): User {
  const now = new Date().toISOString();
  return {
    id: SIM_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: "dev-simulated@ara.local",
    email_confirmed_at: now,
    phone: "",
    confirmed_at: now,
    last_sign_in_at: now,
    app_metadata: {},
    user_metadata: { full_name: "Dev Simulated" },
    identities: [],
    created_at: now,
    updated_at: now,
    is_anonymous: false,
  } as User;
}

export function buildSimulatedSession(user: User): Session {
  return {
    access_token: "dev-simulated-access-token-invalid",
    refresh_token: "dev-simulated-refresh",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
    token_type: "bearer",
    user,
  } as Session;
}
