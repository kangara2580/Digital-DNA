import { NextRequest, NextResponse } from "next/server";
import { createOAuthState, setOAuthStateCookie } from "@/lib/tiktokSession";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function resolveRedirectUri(req: NextRequest): string {
  // TikTok의 "Redirect URLs"는 env 값과 정확히 맞아야 합니다.
  // 배포 도메인이 여러 개면 env 값으로 고정하는 게 가장 안전해요.
  const envUri = process.env.TIKTOK_REDIRECT_URI?.trim();
  if (envUri) return envUri;
  return `${req.nextUrl.origin}/api/auth/tiktok/callback`;
}

export async function GET(req: NextRequest) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim();
  if (!clientKey) {
    return NextResponse.json(
      { error: "missing_tiktok_client_key" },
      { status: 500 },
    );
  }

  const redirectUri = resolveRedirectUri(req);
  const state = createOAuthState();
  const scope = process.env.TIKTOK_OAUTH_SCOPE?.trim() || "user.info.basic,video.list";
  const disableAutoAuth =
    process.env.TIKTOK_DISABLE_AUTO_AUTH?.trim() === "0" ? "0" : "1";

  const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
  authUrl.searchParams.set("client_key", clientKey);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("disable_auto_auth", disableAutoAuth);

  const res = NextResponse.redirect(authUrl);
  setOAuthStateCookie(res, state);
  return res;
}

