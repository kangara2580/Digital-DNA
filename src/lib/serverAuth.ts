import { createClient } from "@supabase/supabase-js";
import { decodeDevUserIdFromJwt } from "@/lib/devJwtFallback";

export type ServerAuthUser = {
  id: string;
  email: string | null;
  user_metadata?: Record<string, unknown>;
};

export type ServerAuthResult =
  | { ok: true; user: ServerAuthUser; token: string }
  | { ok: false; status: 401 | 403 | 503; error: string };

export async function requireBearerUser(request: Request): Promise<ServerAuthResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { ok: false, status: 503, error: "not_configured" };
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
  if (!token) {
    return { ok: false, status: 401, error: "login_required" };
  }

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    const fallbackUserId = decodeDevUserIdFromJwt(token);
    if (!fallbackUserId) {
      return { ok: false, status: 401, error: "invalid_session" };
    }
    return {
      ok: true,
      token,
      user: { id: fallbackUserId, email: null, user_metadata: {} },
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    profile &&
    typeof profile.account_status === "string" &&
    profile.account_status !== "active"
  ) {
    return { ok: false, status: 403, error: `account_${profile.account_status}` };
  }

  return {
    ok: true,
    token,
    user: {
      id: user.id,
      email: user.email ?? null,
      user_metadata: user.user_metadata,
    },
  };
}
