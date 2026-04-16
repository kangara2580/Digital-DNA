import { NextRequest, NextResponse } from "next/server";
import {
  clearOAuthStateCookie,
  setTikTokSessionCookie,
  readOAuthState,
  type TikTokSession,
} from "@/lib/tiktokSession";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TikTokTokenPayload = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  open_id?: string;
  scope?: string;
  token_type?: string;
  data?: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    open_id?: string;
    scope?: string;
    token_type?: string;
  };
  error?: string;
  error_description?: string;
  message?: string;
};

function homeUrl(req: NextRequest, status: "connected" | "error", reason?: string): URL {
  const u = new URL("/", resolveAppOrigin(req));
  if (status === "connected") {
    u.searchParams.set("tiktok", "connected");
  } else {
    u.searchParams.set("tiktok_error", reason ?? "oauth_failed");
  }
  return u;
}

function resolveAppOrigin(req: NextRequest): string {
  const fromNextAuth = process.env.NEXTAUTH_URL?.trim();
  if (fromNextAuth) {
    try {
      return new URL(fromNextAuth).origin;
    } catch {
      /* ignore invalid env */
    }
  }

  const fromRedirect = process.env.TIKTOK_REDIRECT_URI?.trim();
  if (fromRedirect) {
    try {
      return new URL(fromRedirect).origin;
    } catch {
      /* ignore invalid env */
    }
  }

  return req.nextUrl.origin;
}

function resolveRedirectUri(req: NextRequest): string {
  const envUri = process.env.TIKTOK_REDIRECT_URI?.trim();
  if (envUri) return envUri;
  return `${req.nextUrl.origin}/api/auth/tiktok/callback`;
}

async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
): Promise<TikTokSession | null> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim();
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim();
  if (!clientKey || !clientSecret) return null;

  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });

  const payload = (await res.json()) as TikTokTokenPayload;
  if (!res.ok) return null;

  const accessToken = payload.access_token ?? payload.data?.access_token;
  if (!accessToken) return null;
  const refreshToken = payload.refresh_token ?? payload.data?.refresh_token;
  if (!refreshToken) return null;
  const expiresIn = payload.expires_in ?? payload.data?.expires_in ?? 3600;

  const trimmedAccess = accessToken.trim();
  const trimmedRefresh = refreshToken.trim();
  const shouldPersistAccess = trimmedAccess.length > 0 && trimmedAccess.length <= 1400;
  const shouldPersistRefresh = trimmedRefresh.length > 0 && trimmedRefresh.length <= 1400;

  return {
    ...(shouldPersistAccess ? { accessToken: trimmedAccess } : null),
    ...(shouldPersistRefresh ? { refreshToken: trimmedRefresh } : null),
    expiresAt: shouldPersistAccess
      ? Math.floor(Date.now() / 1000) + Math.max(60, Number(expiresIn))
      : Math.floor(Date.now() / 1000),
  };
}

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("state")?.trim() ?? "";
  const code = req.nextUrl.searchParams.get("code")?.trim() ?? "";
  const err = req.nextUrl.searchParams.get("error")?.trim();

  if (err) {
    const res = NextResponse.redirect(homeUrl(req, "error", err));
    clearOAuthStateCookie(res);
    return res;
  }

  const cookieState = readOAuthState(req);
  if (!state || !cookieState || state !== cookieState) {
    const res = NextResponse.redirect(homeUrl(req, "error", "state_mismatch"));
    clearOAuthStateCookie(res);
    return res;
  }

  if (!code) {
    const res = NextResponse.redirect(homeUrl(req, "error", "missing_code"));
    clearOAuthStateCookie(res);
    return res;
  }

  try {
    const redirectUri = resolveRedirectUri(req);
    const session = await exchangeCodeForToken(code, redirectUri);
    if (!session) {
      const res = NextResponse.redirect(homeUrl(req, "error", "token_exchange_failed"));
      clearOAuthStateCookie(res);
      return res;
    }

    const res = NextResponse.redirect(homeUrl(req, "connected"));
    setTikTokSessionCookie(res, session);
    clearOAuthStateCookie(res);
    return res;
  } catch {
    const res = NextResponse.redirect(homeUrl(req, "error", "callback_failed"));
    clearOAuthStateCookie(res);
    return res;
  }
}

