import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ensureVideoCategoryColumn } from "@/lib/ensureVideoCategoryColumn";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Metric = "sales" | "revenue";

type LeaderboardRow = {
  sellerId: string;
  nickname: string | null;
  avatarCustom: string | null;
  topCategory: string | null;
  totalSales: bigint | number;
  totalRevenue: bigint | number;
};

type LeaderboardItem = {
  rank: number;
  sellerId: string;
  nickname: string;
  avatarUrl: string | null;
  category: string;
  totalSales: number;
  totalRevenue: number;
};

function toMetric(value: string | null): Metric {
  return value === "revenue" ? "revenue" : "sales";
}

function toSafeCategory(value: string | null): string {
  if (!value) return "all";
  const trimmed = value.trim();
  if (!trimmed) return "all";
  if (trimmed.length > 48) return "all";
  return trimmed.toLowerCase();
}

function bigintToNumber(value: bigint | number): number {
  if (typeof value === "bigint") return Number(value);
  return Number.isFinite(value) ? value : 0;
}

function fallbackNickname(sellerId: string): string {
  return `Seller ${sellerId.slice(0, 6)}`;
}

function pickAvatarUrl(avatarCustom: string | null): string | null {
  if (!avatarCustom) return null;
  const raw = avatarCustom.trim();
  if (!raw) return null;
  if (raw.startsWith("data:image/")) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  return null;
}

function safeLabelCategory(value: string | null | undefined): string {
  const raw = value?.trim();
  if (!raw) return "미분류";
  return raw;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const metric = toMetric(searchParams.get("metric"));
  const category = toSafeCategory(searchParams.get("category"));

  try {
    await ensureVideoCategoryColumn();
    const isSqlite = (process.env.DATABASE_URL?.trim() ?? "").startsWith("file:");
    const whereClause =
      category === "all" ? Prisma.sql`` : Prisma.sql`WHERE v.category = ${category}`;

    let rows: LeaderboardRow[] = [];

    if (!isSqlite) {
      const orderSql =
        metric === "revenue"
          ? Prisma.sql`ORDER BY "totalRevenue" DESC, "totalSales" DESC`
          : Prisma.sql`ORDER BY "totalSales" DESC, "totalRevenue" DESC`;

      rows = await prisma.$queryRaw<LeaderboardRow[]>(Prisma.sql`
        SELECT
          v.seller_id AS "sellerId",
          p.nickname AS nickname,
          p.avatar_custom AS "avatarCustom",
          COALESCE(
            (
              ARRAY_REMOVE(
                ARRAY_AGG(NULLIF(v.category, '') ORDER BY v.sales_count DESC, v.created_at DESC),
                NULL
              )
            )[1],
            '미분류'
          ) AS "topCategory",
          COALESCE(SUM(v.sales_count), 0)::bigint AS "totalSales",
          COALESCE(SUM(v.sales_count * v.price), 0)::bigint AS "totalRevenue"
        FROM videos v
        LEFT JOIN profiles p ON p.user_id::text = v.seller_id
        ${whereClause}
        GROUP BY v.seller_id, p.nickname, p.avatar_custom
        HAVING COALESCE(SUM(v.sales_count), 0) > 0
        ${orderSql}
        LIMIT 10
      `);
    } else {
      const videos = await prisma.video.findMany({
        where: category === "all" ? undefined : { category },
        select: {
          sellerId: true,
          salesCount: true,
          price: true,
          category: true,
          createdAt: true,
        },
      });
      const bySeller = new Map<
        string,
        { totalSales: number; totalRevenue: number; topCategory: string; newestMs: number }
      >();
      for (const v of videos) {
        const current = bySeller.get(v.sellerId) ?? {
          totalSales: 0,
          totalRevenue: 0,
          topCategory: "미분류",
          newestMs: 0,
        };
        current.totalSales += v.salesCount;
        current.totalRevenue += v.salesCount * v.price;
        const createdMs = v.createdAt.getTime();
        if (createdMs >= current.newestMs && v.category?.trim()) {
          current.topCategory = v.category.trim();
          current.newestMs = createdMs;
        }
        bySeller.set(v.sellerId, current);
      }
      rows = Array.from(bySeller.entries())
        .filter(([, agg]) => agg.totalSales > 0)
        .map(([sellerId, agg]) => ({
          sellerId,
          nickname: null,
          avatarCustom: null,
          topCategory: agg.topCategory,
          totalSales: agg.totalSales,
          totalRevenue: agg.totalRevenue,
        }));
      rows.sort((a, b) => {
        if (metric === "revenue") {
          return bigintToNumber(b.totalRevenue) - bigintToNumber(a.totalRevenue);
        }
        return bigintToNumber(b.totalSales) - bigintToNumber(a.totalSales);
      });
      rows = rows.slice(0, 10);
    }

    const ranked: LeaderboardItem[] = rows.map((row, idx) => ({
      rank: idx + 1,
      sellerId: row.sellerId,
      nickname: row.nickname?.trim() || fallbackNickname(row.sellerId),
      avatarUrl: pickAvatarUrl(row.avatarCustom),
      category: category === "all" ? safeLabelCategory(row.topCategory) : category,
      totalSales: bigintToNumber(row.totalSales),
      totalRevenue: bigintToNumber(row.totalRevenue),
    }));

    const categoryRows = await prisma.video.findMany({
      where: { category: { not: null } },
      select: { category: true },
      orderBy: { createdAt: "desc" },
      take: 400,
    });
    const categories = Array.from(
      new Set(
        categoryRows
          .map((v) => v.category?.trim().toLowerCase() ?? "")
          .filter((v) => v.length > 0),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      ok: true,
      rankings: ranked,
      categories,
      metric,
      category,
    });
  } catch (error) {
    console.error("[leaderboard] GET failed", error);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}
