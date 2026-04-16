import { NextRequest, NextResponse } from "next/server";
import { createOAuthState, setOAuthStateCookie } from "@/lib/tiktokSession";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function resolveRedirectUri(req: NextRequest): string {
  // 배포 환경에서 도메인/프로토콜이 바뀌면 env 값과 redirect_uri가
  // 미세하게 달라져서 TikTok이 로그인 거부하는 경우가 있어요.
  // 그래서 현재 요청의 origin을 기준으로 콜백 URI를 항상 생성합니다.
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

