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

  // 빠른 진단용: /api/auth/tiktok/login?debug=1 로 들어가면 redirect_uri가 뭔지 보여줍니다.
  // TikTok 콘솔 등록값과 1:1로 맞추는 데 필요합니다.
  const debug = req.nextUrl.searchParams.get("debug") === "1";
  if (debug) {
    return NextResponse.json(
      {
        redirectUri,
        scope,
        disableAutoAuth,
        // state는 앱에서 검증에 쓰이므로 그대로 노출하는 게 맞습니다(비밀키는 아님).
        state,
        authUrl: authUrl.toString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const res = NextResponse.redirect(authUrl);
  setOAuthStateCookie(res, state);
  return res;
}

