import { NextRequest, NextResponse } from "next/server";
import { TRENDING_RANK_CLIPS, type FeedVideo } from "@/data/videos";
import { TIKTOK_MOCK_DANCE_CLIPS } from "@/data/tiktokMockTrending";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TikTokVideoItem = {
  id: string;
  title: string;
  creator: string;
  videoUrl: string;
  posterUrl: string;
  durationSec?: number;
};

function pickRandom<T>(items: T[], count: number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

function fallbackTrendingVideos(): FeedVideo[] {
  const base = TIKTOK_MOCK_DANCE_CLIPS.length
    ? TIKTOK_MOCK_DANCE_CLIPS
    : TRENDING_RANK_CLIPS.slice(0, 10);
  return base.map((v, i) => ({
    ...v,
    id: `fallback-trending-${i + 1}-${v.id}`,
    orientation: "portrait",
  }));
}

function resolveDiscoveryEndpoint(raw: string | undefined): string | null {
  const endpoint = raw?.trim();
  if (!endpoint) return null;
  if (endpoint.endsWith("/v2") || endpoint.endsWith("/v2/")) {
    return "https://open.tiktokapis.com/v2/research/video/query/";
  }
  return endpoint;
}

async function fetchAccessTokenByClientSecret(): Promise<string | null> {
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
        grant_type: "client_credentials",
      }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      access_token?: string;
      data?: { access_token?: string };
    };
    return (
      asNonEmptyString(data.access_token) ||
      asNonEmptyString(data.data?.access_token) ||
      null
    );
  } catch {
    return null;
  }
}

function asNonEmptyString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTikTokResponse(payload: unknown): TikTokVideoItem[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;

  const candidates =
    (Array.isArray(root.items) ? root.items : null) ??
    (Array.isArray(root.videos) ? root.videos : null) ??
    ((root.data &&
      typeof root.data === "object" &&
      Array.isArray((root.data as Record<string, unknown>).videos)
        ? ((root.data as Record<string, unknown>).videos as unknown[])
        : null) ??
      (root.data &&
      typeof root.data === "object" &&
      Array.isArray((root.data as Record<string, unknown>).items)
        ? ((root.data as Record<string, unknown>).items as unknown[])
        : null)) ??
    [];

  return candidates
    .map((raw, index) => {
      if (!raw || typeof raw !== "object") return null;
      const r = raw as Record<string, unknown>;

      const id =
        asNonEmptyString(r.id) ||
        asNonEmptyString(r.video_id) ||
        asNonEmptyString(r.aweme_id) ||
        `tiktok-${index + 1}`;
      const title =
        asNonEmptyString(r.title) ||
        asNonEmptyString(r.desc) ||
        "TikTok dance clip";
      const creator =
        asNonEmptyString(r.creator) ||
        asNonEmptyString(r.author_name) ||
        asNonEmptyString(r.username) ||
        "@tiktok_creator";
      const videoUrl =
        asNonEmptyString(r.videoUrl) ||
        asNonEmptyString(r.play_url) ||
        asNonEmptyString(r.download_url) ||
        asNonEmptyString(r.video_url);
      const posterUrl =
        asNonEmptyString(r.posterUrl) ||
        asNonEmptyString(r.cover_image_url) ||
        asNonEmptyString(r.cover_url) ||
        asNonEmptyString(r.thumbnail_url);
      const durationRaw =
        typeof r.durationSec === "number"
          ? r.durationSec
          : typeof r.duration === "number"
            ? r.duration
            : undefined;

      if (!videoUrl || !posterUrl) return null;
      return {
        id,
        title,
        creator: creator.startsWith("@") ? creator : `@${creator}`,
        videoUrl,
        posterUrl,
        durationSec: durationRaw,
      } satisfies TikTokVideoItem;
    })
    .filter((x): x is TikTokVideoItem => Boolean(x));
}

export async function GET(request: NextRequest) {
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "10") || 10;
  const limit = Math.max(1, Math.min(10, limitRaw));
  const keyword = request.nextUrl.searchParams.get("keyword")?.trim() || "dance";

  const endpoint = resolveDiscoveryEndpoint(process.env.TIKTOK_DISCOVERY_ENDPOINT);
  const envToken = process.env.TIKTOK_ACCESS_TOKEN?.trim() || null;
  const token = envToken || (await fetchAccessTokenByClientSecret());
  // 승인 전에는 항상 Mock 데이터만 사용 (실호출 완전 비활성화)
  const forceMockOnly = true;

  if (forceMockOnly) {
    return NextResponse.json({
      source: "fallback",
      reason: "mock_only_mode",
      items: pickRandom(fallbackTrendingVideos(), limit),
    });
  }

  if (!endpoint || !token) {
    return NextResponse.json({
      source: "fallback",
      reason: "missing_tiktok_env_or_token",
      items: fallbackTrendingVideos().slice(0, limit),
    });
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          and: [
            {
              operation: "IN",
              field_name: "keyword",
              field_values: [keyword],
            },
          ],
        },
        max_count: Math.max(20, limit * 3),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`tiktok_api_${response.status}`);
    }

    const data = (await response.json()) as unknown;
    const normalized = normalizeTikTokResponse(data);
    const sampled = pickRandom(normalized, limit);

    if (!sampled.length) {
      return NextResponse.json({
        source: "fallback",
        reason: "empty_tiktok_response",
        items: fallbackTrendingVideos().slice(0, limit),
      });
    }

    const items: FeedVideo[] = sampled.map((v, i) => ({
      id: `tiktok-${i + 1}-${v.id}`,
      title: v.title,
      creator: v.creator,
      src: v.videoUrl,
      previewSrc: v.videoUrl,
      poster: v.posterUrl,
      orientation: "portrait",
      durationSec: v.durationSec,
      priceWon: 900 + (i % 5) * 300,
      isAiGenerated: false,
    }));

    return NextResponse.json({
      source: "tiktok",
      items,
    });
  } catch (error) {
    return NextResponse.json({
      source: "fallback",
      reason: error instanceof Error ? error.message : "tiktok_unknown_error",
      items: fallbackTrendingVideos().slice(0, limit),
    });
  }
}
