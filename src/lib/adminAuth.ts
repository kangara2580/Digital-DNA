import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAuthCookieOptions } from "@/lib/supabaseCookieOptions";

export type AdminUser = { id: string; email: string | null };

export type AdminAccess =
  | {
      ok: true;
      mode: "authenticated" | "development";
      user: AdminUser | null;
      reason?: string;
    }
  | {
      ok: false;
      mode: "denied" | "not_configured";
      reason: string;
    };

function splitEnvList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function adminEmails(): string[] {
  return splitEnvList(process.env.ADMIN_EMAILS).map((v) => v.toLowerCase());
}

function adminUserIds(): string[] {
  return splitEnvList(process.env.ADMIN_USER_IDS);
}

export function hasAdminPolicyConfigured(): boolean {
  return adminEmails().length > 0 || adminUserIds().length > 0;
}

export async function getAdminAccess(): Promise<AdminAccess> {
  const configured = hasAdminPolicyConfigured();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !anonKey) {
    if (process.env.NODE_ENV !== "production") {
      return {
        ok: true,
        mode: "development",
        user: null,
        reason: "Supabase auth is not configured, so local admin preview is enabled.",
      };
    }
    return {
      ok: false,
      mode: "not_configured",
      reason: "Supabase auth is required for production admin access.",
    };
  }

  if (!configured && process.env.NODE_ENV !== "production") {
    return {
      ok: true,
      mode: "development",
      user: null,
      reason: "ADMIN_EMAILS or ADMIN_USER_IDS is not set, so local admin preview is enabled.",
    };
  }

  if (!configured) {
    return {
      ok: false,
      mode: "not_configured",
      reason: "ADMIN_EMAILS or ADMIN_USER_IDS must be set before enabling admin access.",
    };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookieOptions: getSupabaseAuthCookieOptions(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Server Components cannot mutate cookies. Admin pages only read auth state here.
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    if (process.env.NODE_ENV !== "production") {
      return {
        ok: true,
        mode: "development",
        user: null,
        reason: "Local admin preview is enabled because no Supabase session was found.",
      };
    }
    return {
      ok: false,
      mode: "denied",
      reason: "로그인된 관리자 세션을 찾을 수 없습니다.",
    };
  }

  const email = user.email?.toLowerCase() ?? "";
  const allowedByEmail = email.length > 0 && adminEmails().includes(email);
  const allowedById = adminUserIds().includes(user.id);

  if (!allowedByEmail && !allowedById) {
    return {
      ok: false,
      mode: "denied",
      reason: "현재 계정은 관리자 권한 목록에 없습니다.",
    };
  }

  return {
    ok: true,
    mode: "authenticated",
    user: { id: user.id, email: user.email ?? null },
  };
}

export async function requireAdminAccess(): Promise<AdminUser> {
  const access = await getAdminAccess();
  if (!access.ok) {
    throw new Error(access.reason);
  }
  if (access.mode === "development") {
    return { id: "local-admin-preview", email: "local-admin-preview@example.test" };
  }
  if (!access.user) {
    throw new Error("관리자 사용자 정보를 찾을 수 없습니다.");
  }
  return access.user;
}
