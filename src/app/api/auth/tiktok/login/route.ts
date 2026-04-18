import { NextRequest, NextResponse } from "next/server";
import {
  createOAuthState,
  createTikTokPkcePair,
  setOAuthStateCookie,
  setPkceVerifierCookie,
} from "@/lib/tiktokSession";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function resolveRedirectUri(req: NextRequest): string {
  const requestOrigin = req.nextUrl.origin;
  const envUri = process.env.TIKTOK_REDIRECT_URI?.trim();
  if (envUri) {
    try {
      const parsed = new URL(envUri);
      // env 값이 현재 요청 도메인과 같을 때만 사용합니다.
      // (예: preview/prod 도메인이 섞일 때 redirect_uri mismatch 방지)
      if (parsed.origin === requestOrigin) return parsed.toString();
    } catch {
      /* invalid env, fallback to request origin */
    }
  }
  return `${requestOrigin}/api/auth/tiktok/callback`;
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
  const { codeVerifier, codeChallenge } = createTikTokPkcePair();
  const scope = process.env.TIKTOK_OAUTH_SCOPE?.trim() || "user.info.basic,video.list";
  const disableAutoAuth =
    process.env.TIKTOK_DISABLE_AUTO_AUTH?.trim() === "0" ? "0" : "1";

  const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
  authUrl.searchParams.set("client_key", clientKey);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
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
        codeChallengeMethod: "S256",
        codeChallengePrefix: `${codeChallenge.slice(0, 12)}…`,
        authUrl: authUrl.toString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const res = NextResponse.redirect(authUrl);
  setOAuthStateCookie(res, state);
  setPkceVerifierCookie(res, codeVerifier);
  return res;
}

