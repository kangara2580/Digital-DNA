import { NextRequest, NextResponse } from "next/server";
import {
  clearOAuthStateCookie,
  clearPkceVerifierCookie,
  createTikTokSessionId,
  readOAuthState,
  readOAuthStatePayload,
  readPkceVerifier,
  setTikTokSidCookie,
  verifyOAuthState,
  type TikTokSession,
} from "@/lib/tiktokSession";
import { prisma } from "@/lib/prisma";

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

function homeUrl(
  req: NextRequest,
  status: "connected" | "error",
  reason?: string,
  detail?: string,
): URL {
  const u = new URL("/", resolveAppOrigin(req));
  if (status === "connected") {
    u.searchParams.set("tiktok", "connected");
  } else {
    u.searchParams.set("tiktok_error", reason ?? "oauth_failed");
    if (detail) u.searchParams.set("tiktok_detail", detail);
  }
  return u;
}

function resolveAppOrigin(req: NextRequest): string {
  const currentOrigin = req.nextUrl.origin;

  const fromNextAuth = process.env.NEXTAUTH_URL?.trim();
  if (fromNextAuth) {
    try {
      const origin = new URL(fromNextAuth).origin;
      if (origin === currentOrigin) return origin;
    } catch {
      /* ignore invalid env */
    }
  }

  const fromRedirect = process.env.TIKTOK_REDIRECT_URI?.trim();
  if (fromRedirect) {
    try {
      const origin = new URL(fromRedirect).origin;
      if (origin === currentOrigin) return origin;
    } catch {
      /* ignore invalid env */
    }
  }

  return currentOrigin;
}

function resolveRedirectUri(req: NextRequest): string {
  const envUri = process.env.TIKTOK_REDIRECT_URI?.trim();
  if (envUri) {
    try {
      const parsed = new URL(envUri);
      // authorize 단계와 token exchange 단계 모두 같은 redirect_uri를 써야 하므로
      // 명시된 env 값을 항상 우선합니다.
      return parsed.toString();
    } catch {
      /* invalid env, fallback to request origin */
    }
  }
  return `${req.nextUrl.origin}/api/auth/tiktok/callback`;
}

async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  codeVerifier: string,
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
      code_verifier: codeVerifier,
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
  return {
    accessToken: trimmedAccess,
    refreshToken: trimmedRefresh,
    expiresAt: Math.floor(Date.now() / 1000) + Math.max(60, Number(expiresIn)),
  };
}

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("state")?.trim() ?? "";
  const code = req.nextUrl.searchParams.get("code")?.trim() ?? "";
  const err = req.nextUrl.searchParams.get("error")?.trim();

  if (err) {
    const res = NextResponse.redirect(homeUrl(req, "error", err));
    clearOAuthStateCookie(res);
    clearPkceVerifierCookie(res);
    return res;
  }

  const cookieState = readOAuthState(req);
  const signedOk = state ? verifyOAuthState(state) : false;
  const cookieOk = Boolean(state && cookieState && state === cookieState);
  if (!signedOk && !cookieOk) {
    const res = NextResponse.redirect(homeUrl(req, "error", "state_mismatch"));
    clearOAuthStateCookie(res);
    clearPkceVerifierCookie(res);
    return res;
  }

  if (!code) {
    const res = NextResponse.redirect(homeUrl(req, "error", "missing_code"));
    clearOAuthStateCookie(res);
    clearPkceVerifierCookie(res);
    return res;
  }

  const fromCookie = readPkceVerifier(req)?.trim() ?? "";
  const fromState = state ? readOAuthStatePayload(state)?.pkceVerifier?.trim() ?? "" : "";
  const codeVerifier = fromCookie || fromState;
  if (!codeVerifier) {
    const res = NextResponse.redirect(homeUrl(req, "error", "missing_code_verifier"));
    clearOAuthStateCookie(res);
    clearPkceVerifierCookie(res);
    return res;
  }

  try {
    const redirectUri = resolveRedirectUri(req);
    const session = await exchangeCodeForToken(code, redirectUri, codeVerifier);
    if (!session) {
      const res = NextResponse.redirect(homeUrl(req, "error", "token_exchange_failed"));
      clearOAuthStateCookie(res);
      clearPkceVerifierCookie(res);
      return res;
    }

    const res = NextResponse.redirect(homeUrl(req, "connected"));
    const sessionId = createTikTokSessionId();
    try {
      await prisma.tikTokAuthSession.create({
        data: {
          sessionId,
          accessToken: session.accessToken ?? null,
          refreshToken: session.refreshToken ?? null,
          expiresAt: session.expiresAt,
        },
      });
    } catch (e) {
      console.error("tiktok_callback_db_write_failed", e);
      const raw =
        e instanceof Error
          ? `${e.name}:${e.message}`
          : typeof e === "string"
            ? e
            : "unknown";
      const cleaned = raw.replace(/[\s\n\r\t]+/g, " ").slice(0, 160);
      const res2 = NextResponse.redirect(
        homeUrl(req, "error", "db_write_failed", cleaned),
      );
      clearOAuthStateCookie(res2);
      clearPkceVerifierCookie(res2);
      return res2;
    }
    setTikTokSidCookie(res, sessionId);
    clearOAuthStateCookie(res);
    clearPkceVerifierCookie(res);
    return res;
  } catch (e) {
    console.error("tiktok_callback_failed", e);
    const message = e instanceof Error ? e.message : "callback_failed";
    const reason =
      message.includes("missing_tiktok") || message.includes("missing_")
        ? "missing_env"
        : "callback_failed";
    const res = NextResponse.redirect(homeUrl(req, "error", reason));
    clearOAuthStateCookie(res);
    clearPkceVerifierCookie(res);
    return res;
  }
}
