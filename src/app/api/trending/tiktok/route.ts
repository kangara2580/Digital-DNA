import { NextRequest, NextResponse } from "next/server";
import type { FeedVideo } from "@/data/videos";
import {
  clearTikTokSessionCookie,
  readTikTokSession,
  setTikTokSessionCookie,
  type TikTokSession,
} from "@/lib/tiktokSession";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TikTokVideo = {
  id?: string | number;
  title?: string;
  video_description?: string;
  duration?: number;
  cover_image_url?: string;
  share_url?: string;
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  open_id?: string;
  token_type?: string;
  data?: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    open_id?: string;
    token_type?: string;
  };
  error?: string;
  error_description?: string;
  message?: string;
};

type VideoListEnvelope = {
  data?: {
    videos?: TikTokVideo[];
    cursor?: number;
    has_more?: boolean;
  };
  error?: { code?: string; message?: string; log_id?: string };
  message?: string;
};

function resolveApiBase(): URL {
  const raw = process.env.TIKTOK_DISCOVERY_ENDPOINT?.trim() || "https://open.tiktokapis.com/v2/";
  const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  const path = u.pathname.replace(/\/+$/, "");
  if (path === "" || path === "/") u.pathname = "/v2/";
  else if (path.endsWith("/v2")) u.pathname = `${path}/`;
  else if (!path.includes("/v2/")) u.pathname = `${path}/v2/`;
  else u.pathname = `${path}/`;
  return u;
}

function buildVideoListUrl(): string {
  const base = resolveApiBase();
  const endpoint = new URL("video/list/", base);
  const fields =
    process.env.TIKTOK_VIDEO_FIELDS?.trim() ||
    "id,title,video_description,duration,cover_image_url,share_url";
  endpoint.searchParams.set("fields", fields);
  return endpoint.toString();
}

function isExpired(session: TikTokSession): boolean {
  return session.expiresAt <= Math.floor(Date.now() / 1000) + 90;
}

async function refreshUserAccessToken(
  session: TikTokSession,
): Promise<TikTokSession | null> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim();
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim();
  if (!clientKey || !clientSecret) return null;

  try {
    const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: session.refreshToken,
      }),
      cache: "no-store",
    });

    const payload = (await res.json()) as TokenResponse;
    if (!res.ok) return null;

    const accessToken = payload.access_token ?? payload.data?.access_token;
    if (!accessToken) return null;
    const nextRefreshToken =
      payload.refresh_token ?? payload.data?.refresh_token ?? session.refreshToken;
    const expiresIn = payload.expires_in ?? payload.data?.expires_in ?? 3600;

    const trimmedAccess = accessToken.trim();
    const shouldPersistAccess = trimmedAccess.length > 0 && trimmedAccess.length <= 1400;

    return {
      refreshToken: nextRefreshToken?.trim() ?? session.refreshToken,
      ...(shouldPersistAccess ? { accessToken: trimmedAccess } : null),
      expiresAt: shouldPersistAccess
        ? Math.floor(Date.now() / 1000) + Math.max(60, Number(expiresIn))
        : Math.floor(Date.now() / 1000),
    };
  } catch {
    return null;
  }
}

async function fetchUserVideos(
  accessToken: string,
  limit: number,
): Promise<{ response: Response; payload: VideoListEnvelope }> {
  const response = await fetch(buildVideoListUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      max_count: limit,
      cursor: 0,
    }),
    cache: "no-store",
  });
  const payload = (await response.json()) as VideoListEnvelope;
  return { response, payload };
}

function toFriendlyError(reason: string): string {
  switch (reason) {
    case "missing_credentials":
      return "TikTok 앱 키/시크릿이 없어 영상을 불러올 수 없어요.";
    case "token_expired":
      return "세션이 만료됐어요. TikTok에 다시 로그인해주세요.";
    case "empty_videos":
      return "로그인한 TikTok 계정에 표시 가능한 영상이 없어요.";
    case "upstream_failed":
      return "TikTok API 호출에 실패했어요. 잠시 후 다시 시도해주세요.";
    default:
      return "영상을 불러오지 못했어요. 다시 시도해주세요.";
  }
}

function mapUserVideos(videos: TikTokVideo[], limit: number): FeedVideo[] {
  return videos.slice(0, limit).map((video, i) => {
    const id = String(video.id ?? `unknown-${i + 1}`);
    const title =
      (video.title ?? video.video_description ?? "").trim() || `TikTok 영상 ${i + 1}`;
    const shareUrl = video.share_url?.trim() || `https://www.tiktok.com/embed/v2/${id}`;
    return {
      id: `tiktok-${id}`,
      title,
      creator: "@my_tiktok",
      src: shareUrl,
      previewSrc: shareUrl,
      poster:
        video.cover_image_url?.trim() ||
        `https://picsum.photos/seed/my-tiktok-${encodeURIComponent(id)}/720/1280`,
      orientation: "portrait",
      durationSec:
        typeof video.duration === "number" ? Math.round(video.duration) : undefined,
      priceWon: 900 + (i % 5) * 300,
      tiktokEmbedId: id,
    } satisfies FeedVideo;
  });
}

function isTokenInvalidCode(code?: string): boolean {
  if (!code) return false;
  const lowered = code.toLowerCase();
  return (
    lowered.includes("access_token") ||
    lowered.includes("invalid_token") ||
    lowered.includes("token_expired") ||
    lowered.includes("invalid_grant")
  );
}

export async function GET(request: NextRequest) {
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "10") || 10;
  const limit = Math.max(1, Math.min(10, limitRaw));

  const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim();
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim();
  if (!clientKey || !clientSecret) {
    return NextResponse.json(
      {
        source: "error" as const,
        reason: "missing_credentials" as const,
        message: toFriendlyError("missing_credentials"),
      },
      { status: 500 },
    );
  }

  const current = readTikTokSession(request);
  if (!current) {
    return NextResponse.json(
      {
        source: "auth" as const,
        reason: "missing_session" as const,
        message: "TikTok 로그인이 필요합니다. Login with TikTok을 눌러주세요.",
      },
      { status: 401 },
    );
  }

  let session = current;
  let refreshedByExpiry = false;
  if (!session.accessToken || isExpired(session)) {
    const refreshed = await refreshUserAccessToken(session);
    if (!refreshed) {
      const res = NextResponse.json(
        {
          source: "auth" as const,
          reason: "token_expired" as const,
          message: toFriendlyError("token_expired"),
        },
        { status: 401 },
      );
      clearTikTokSessionCookie(res);
      return res;
    }
    session = refreshed;
    refreshedByExpiry = true;
  }

  const access = session.accessToken;
  if (!access) {
    const res = NextResponse.json(
      {
        source: "auth" as const,
        reason: "token_expired" as const,
        message: toFriendlyError("token_expired"),
      },
      { status: 401 },
    );
    clearTikTokSessionCookie(res);
    return res;
  }

  try {
    let { response, payload } = await fetchUserVideos(access, limit);

    if (
      (!response.ok || (payload.error?.code && payload.error.code !== "ok")) &&
      isTokenInvalidCode(payload.error?.code) &&
      session.refreshToken
    ) {
      const refreshed = await refreshUserAccessToken(session);
      if (refreshed) {
        session = refreshed;
        const access2 = session.accessToken;
        if (!access2) {
          const res = NextResponse.json(
            {
              source: "auth" as const,
              reason: "token_expired" as const,
              message: toFriendlyError("token_expired"),
            },
            { status: 401 },
          );
          clearTikTokSessionCookie(res);
          return res;
        }
        ({ response, payload } = await fetchUserVideos(access2, limit));
        refreshedByExpiry = true;
      }
    }

    if (!response.ok || (payload.error?.code && payload.error.code !== "ok")) {
      const code = payload.error?.code ?? String(response.status);
      const detailMessage = payload.error?.message ?? payload.message ?? "";
      return NextResponse.json(
        {
          source: "error" as const,
          reason: "upstream_failed" as const,
          message: toFriendlyError("upstream_failed"),
          detail:
            detailMessage.length > 0
              ? `[${code}] ${detailMessage}`
              : `[${code}] unknown upstream error`,
        },
        { status: 502 },
      );
    }

    const videos = payload.data?.videos ?? [];
    const items = mapUserVideos(videos, limit).filter((v) => Boolean(v.tiktokEmbedId));
    if (items.length === 0) {
      return NextResponse.json(
        {
          source: "error" as const,
          reason: "empty_videos" as const,
          message: toFriendlyError("empty_videos"),
          items: [],
        },
        { status: 200 },
      );
    }

    const res = NextResponse.json({
      source: "tiktok" as const,
      items,
      cursor: payload.data?.cursor,
      hasMore: payload.data?.has_more,
    });
    if (refreshedByExpiry) {
      setTikTokSessionCookie(res, session);
    }
    return res;
  } catch {
    return NextResponse.json(
      {
        source: "error" as const,
        reason: "unknown_error" as const,
        message: toFriendlyError("unknown_error"),
        detail: "tiktok_unknown_error",
      },
      { status: 502 },
    );
  }
}
