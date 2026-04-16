import { NextRequest, NextResponse } from "next/server";
import {
  clearOAuthStateCookie,
  readOAuthState,
  createTikTokSessionId,
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
  // authorize 요청에서 보낸 redirect_uri와 토큰교환 redirect_uri는
  // 반드시 동일해야 합니다. env 값이 있으면 env로 고정합니다.
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
    return res;
  }

  const cookieState = readOAuthState(req);
  const signedOk = state ? verifyOAuthState(state) : false;
  const cookieOk = Boolean(state && cookieState && state === cookieState);
  if (!signedOk && !cookieOk) {
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
      return res2;
    }
    setTikTokSidCookie(res, sessionId);
    clearOAuthStateCookie(res);
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
    return res;
  }
}
