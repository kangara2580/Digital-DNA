import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  BEST_REVIEW_AVATAR_PRESETS,
  buildNotionistsAvatarUrl,
  DEFAULT_BEST_REVIEW_AVATAR_SEED,
} from "@/data/reelsAvatarPresets";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Metric = "sales" | "revenue";
type Period = "today" | "7d" | "30d";

type LeaderboardRow = {
  videoId: string;
  title: string | null;
  sellerId: string;
  nickname: string | null;
  avatarCustom: string | null;
  salesCount: bigint | number;
  totalRevenue: bigint | number;
};

type LeaderboardItem = {
  rank: number;
  videoId: string;
  title: string;
  sellerId: string;
  nickname: string;
  avatarUrl: string | null;
  totalSales: number;
  totalRevenue: number;
};

function toMetric(value: string | null): Metric {
  return value === "revenue" ? "revenue" : "sales";
}

function toPeriod(value: string | null): Period {
  if (value === "7d") return "7d";
  if (value === "30d") return "30d";
  return "today";
}

function periodStart(period: Period): Date {
  const now = new Date();
  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }
  const days = period === "7d" ? 7 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function bigintToNumber(value: bigint | number): number {
  if (typeof value === "bigint") return Number(value);
  return Number.isFinite(value) ? value : 0;
}

function fallbackNickname(seed: string): string {
  return `판매자 ${seed.slice(0, 6)}`;
}

function pickAvatarUrl(avatarCustom: string | null): string | null {
  if (!avatarCustom) return null;
  const raw = avatarCustom.trim();
  if (!raw) return null;
  if (raw.startsWith("data:image/")) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  return null;
}

function fallbackTitle(seed: string): string {
  return `인기 동영상 #${seed.slice(0, 6)}`;
}

function hashToIndex(input: string, length: number): number {
  if (length <= 1) return 0;
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

function fallbackAvatarUrl(seed: string): string {
  const presets = BEST_REVIEW_AVATAR_PRESETS;
  if (presets.length === 0) {
    return buildNotionistsAvatarUrl(DEFAULT_BEST_REVIEW_AVATAR_SEED);
  }
  const idx = hashToIndex(seed, presets.length);
  return buildNotionistsAvatarUrl(presets[idx]!.seed);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const metric = toMetric(searchParams.get("metric"));
  const period = toPeriod(searchParams.get("period"));

  try {
    const isSqlite = (process.env.DATABASE_URL?.trim() ?? "").startsWith("file:");
    const since = periodStart(period);
    const periodSql =
      period === "today"
        ? Prisma.sql`AND v.created_at >= date_trunc('day', now())`
        : period === "7d"
          ? Prisma.sql`AND v.created_at >= now() - interval '7 day'`
          : Prisma.sql`AND v.created_at >= now() - interval '30 day'`;

    let rows: LeaderboardRow[] = [];

    if (!isSqlite) {
      const orderSql =
        metric === "revenue"
          ? Prisma.sql`ORDER BY "totalRevenue" DESC, "salesCount" DESC, v.created_at DESC`
          : Prisma.sql`ORDER BY "salesCount" DESC, "totalRevenue" DESC, v.created_at DESC`;

      rows = await prisma.$queryRaw<LeaderboardRow[]>(Prisma.sql`
        SELECT
          v.id AS "videoId",
          v.title AS title,
          v.seller_id AS "sellerId",
          p.nickname AS nickname,
          p.avatar_custom AS "avatarCustom",
          COALESCE(v.sales_count, 0)::bigint AS "salesCount",
          COALESCE(v.sales_count * v.price, 0)::bigint AS "totalRevenue"
        FROM videos v
        LEFT JOIN profiles p ON p.user_id::text = v.seller_id
        WHERE COALESCE(v.sales_count, 0) > 0
        ${periodSql}
        ${orderSql}
        LIMIT 10
      `);
    } else {
      const videos = await prisma.video.findMany({
        where: {
          salesCount: { gt: 0 },
          createdAt: { gte: since },
        },
        select: {
          id: true,
          title: true,
          sellerId: true,
          salesCount: true,
          price: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      });
      rows = videos.map((video) => ({
        videoId: video.id,
        title: video.title,
        sellerId: video.sellerId,
        nickname: null,
        avatarCustom: null,
        salesCount: video.salesCount,
        totalRevenue: video.salesCount * video.price,
      }));
      rows.sort((a, b) => {
        if (metric === "revenue") {
          const revenueDiff = bigintToNumber(b.totalRevenue) - bigintToNumber(a.totalRevenue);
          if (revenueDiff !== 0) return revenueDiff;
          return bigintToNumber(b.salesCount) - bigintToNumber(a.salesCount);
        }
        const salesDiff = bigintToNumber(b.salesCount) - bigintToNumber(a.salesCount);
        if (salesDiff !== 0) return salesDiff;
        return bigintToNumber(b.totalRevenue) - bigintToNumber(a.totalRevenue);
      });
      rows = rows.slice(0, 10);
    }

    const ranked: LeaderboardItem[] = rows.map((row, idx) => ({
      rank: idx + 1,
      videoId: row.videoId,
      title: row.title?.trim() || fallbackTitle(row.videoId),
      sellerId: row.sellerId,
      nickname: row.nickname?.trim() || fallbackNickname(row.sellerId),
      avatarUrl: pickAvatarUrl(row.avatarCustom) ?? fallbackAvatarUrl(row.sellerId),
      totalSales: bigintToNumber(row.salesCount),
      totalRevenue: bigintToNumber(row.totalRevenue),
    }));

    return NextResponse.json({
      ok: true,
      rankings: ranked,
      metric,
      period,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[leaderboard] GET failed", error);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}
