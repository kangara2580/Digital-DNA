import { NextRequest, NextResponse } from "next/server";
import { TRENDING_RANK_CLIPS, type FeedVideo } from "@/data/videos";
import { TIKTOK_MOCK_DANCE_CLIPS } from "@/data/tiktokMockTrending";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ResearchVideo = {
  id?: number | string;
  video_id?: number | string;
  video_description?: string;
  username?: string;
  video_duration?: number;
  create_time?: number;
  like_count?: number;
  view_count?: number;
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

function buildResearchVideoQueryUrl(): string {
  const base =
    resolveDiscoveryEndpoint(process.env.TIKTOK_DISCOVERY_ENDPOINT) ??
    "https://open.tiktokapis.com/v2/research/video/query/";
  const fields =
    process.env.TIKTOK_RESEARCH_FIELDS?.trim() ||
    "id,video_description,create_time,username,region_code,like_count,view_count,video_duration,hashtag_names";
  const u = new URL(
    base.startsWith("http") ? base : `https://${base}`,
  );
  u.searchParams.set("fields", fields);
  return u.toString();
}

function ymdUtc(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

/** Research API: end_date는 start_date로부터 최대 30일 */
function defaultDateRange(): { start_date: string; end_date: string } {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 29);
  return { start_date: ymdUtc(start), end_date: ymdUtc(end) };
}

/** 비어 있으면 region 필터 없이 keyword만 조회(샌드박스에서 0건 방지에 유리) */
function parseRegionCodes(): string[] {
  const raw = process.env.TIKTOK_REGION_CODES?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
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
    const data = (await res.json()) as {
      access_token?: string;
      data?: { access_token?: string };
      error?: string;
      error_description?: string;
      message?: string;
    };
    if (!res.ok) return null;
    const t = data.access_token ?? data.data?.access_token;
    return typeof t === "string" && t.length > 0 ? t.trim() : null;
  } catch {
    return null;
  }
}

/** Client Key+Secret이 있으면 OAuth 토큰 우선(짧은 값을 ACCESS_TOKEN에 넣은 경우 401 방지) */
async function resolveBearerToken(): Promise<string | null> {
  const envToken = process.env.TIKTOK_ACCESS_TOKEN?.trim() || null;
  const hasClientCreds =
    Boolean(process.env.TIKTOK_CLIENT_KEY?.trim()) &&
    Boolean(process.env.TIKTOK_CLIENT_SECRET?.trim());
  if (hasClientCreds) {
    const oauth = await fetchAccessTokenByClientSecret();
    if (oauth) return oauth;
  }
  return envToken;
}

function researchVideosToFeedVideos(
  videos: ResearchVideo[],
  limit: number,
): FeedVideo[] {
  const picked = pickRandom(videos, limit);
  return picked.map((v, i) => {
    const rawId = v.id ?? v.video_id;
    const vid =
      rawId !== undefined && rawId !== null ? String(rawId) : `unknown-${i}`;
    const username = (v.username ?? "creator").replace(/^@/, "");
    const title =
      (v.video_description ?? "TikTok clip").trim().slice(0, 200) ||
      "TikTok clip";
    const watchUrl = `https://www.tiktok.com/@${username}/video/${vid}`;
    return {
      id: `tiktok-${i + 1}-${vid}`,
      title,
      creator: `@${username}`,
      src: watchUrl,
      previewSrc: watchUrl,
      poster: `https://picsum.photos/seed/tiktok${encodeURIComponent(vid)}/720/1280`,
      orientation: "portrait",
      durationSec:
        typeof v.video_duration === "number" && Number.isFinite(v.video_duration)
          ? Math.round(v.video_duration)
          : undefined,
      priceWon: 900 + (i % 5) * 300,
      isAiGenerated: false,
      tiktokEmbedId: vid,
    } satisfies FeedVideo;
  });
}

export async function GET(request: NextRequest) {
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "10") || 10;
  const limit = Math.max(1, Math.min(10, limitRaw));
  const keyword =
    request.nextUrl.searchParams.get("keyword")?.trim() || "dance";

  const useMockOnly = process.env.TIKTOK_USE_MOCK_ONLY === "true";

  if (useMockOnly) {
    return NextResponse.json({
      source: "fallback" as const,
      reason: "mock_only_mode",
      items: pickRandom(fallbackTrendingVideos(), limit),
    });
  }

  const ck = process.env.TIKTOK_CLIENT_KEY?.trim();
  const cs = process.env.TIKTOK_CLIENT_SECRET?.trim();
  const envTokEarly = process.env.TIKTOK_ACCESS_TOKEN?.trim();
  /** Secret만 있고 Key가 없으면 OAuth 불가 — 별도로 넣은 Bearer 토큰이 없을 때만 차단 */
  if (cs && !ck && !envTokEarly) {
    return NextResponse.json({
      source: "fallback" as const,
      reason: "missing_tiktok_client_key",
      items: fallbackTrendingVideos().slice(0, limit),
    });
  }

  const token = await resolveBearerToken();

  if (!token) {
    return NextResponse.json({
      source: "fallback" as const,
      reason: "missing_tiktok_token",
      items: fallbackTrendingVideos().slice(0, limit),
    });
  }

  const url = buildResearchVideoQueryUrl();
  const { start_date, end_date } = defaultDateRange();
  const regions = parseRegionCodes();

  const andConditions: Array<{
    operation: "IN" | "EQ";
    field_name: string;
    field_values: string[];
  }> = [
    {
      operation: "EQ",
      field_name: "keyword",
      field_values: [keyword],
    },
  ];
  if (regions.length > 0) {
    andConditions.unshift({
      operation: "IN",
      field_name: "region_code",
      field_values: regions,
    });
  }

  const body = {
    query: {
      and: andConditions,
    },
    start_date,
    end_date,
    max_count: 100,
    cursor: 0,
    is_random: true,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const rawText = await response.text();
    let payload: unknown;
    try {
      payload = JSON.parse(rawText) as unknown;
    } catch {
      throw new Error(`tiktok_api_${response.status}_invalid_json`);
    }

    const envelopePre = payload as {
      error?: { code?: string; message?: string; log_id?: string };
      message?: string;
      data?: { videos?: ResearchVideo[] };
    };

    if (!response.ok) {
      const hint =
        envelopePre.error?.message ||
        envelopePre.message ||
        (typeof envelopePre.error?.code === "string"
          ? String(envelopePre.error.code)
          : "");
      throw new Error(
        `tiktok_api_${response.status}${hint ? `:${hint.slice(0, 200)}` : ""}`,
      );
    }

    const envelope = envelopePre;
    if (envelope.error?.code && envelope.error.code !== "ok") {
      throw new Error(
        `tiktok_api_${envelope.error.code}:${envelope.error.message ?? ""}`,
      );
    }

    const list = envelope.data?.videos ?? [];
    if (!Array.isArray(list) || list.length === 0) {
      return NextResponse.json({
        source: "fallback" as const,
        reason: "empty_tiktok_response",
        items: fallbackTrendingVideos().slice(0, limit),
      });
    }

    const items = researchVideosToFeedVideos(list, limit);

    return NextResponse.json({
      source: "tiktok" as const,
      items,
    });
  } catch (error) {
    return NextResponse.json({
      source: "fallback" as const,
      reason: error instanceof Error ? error.message : "tiktok_unknown_error",
      items: fallbackTrendingVideos().slice(0, limit),
    });
  }
}
