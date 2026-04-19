import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * 서버 전용 — `SUPABASE_SERVICE_ROLE_KEY` 가 있을 때만 사용.
 * RLS를 우회하므로 **라우트 핸들러 안에서만** 쓰고, 클라이언트로 키를 내보내지 마세요.
 */
export function getSupabaseServiceRoleClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const srk = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !srk) return null;
  return createClient(url, srk, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
