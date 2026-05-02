import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AdminVideoSearchParams = {
  q?: string;
  status?: string;
  provider?: string;
  page?: string;
};

export type AdminVideoListItem = {
  id: string;
  title: string;
  creator: string;
  sellerId: string;
  price: number;
  status: string;
  category: string | null;
  poster: string;
  src: string;
  sourcePageUrl: string | null;
  externalProvider: string | null;
  externalKey: string | null;
  createdAt: string;
};

export type AdminVideosData = {
  items: AdminVideoListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  q: string;
  status: string;
  provider: string;
  statusCounts: Record<string, number>;
};

const PAGE_SIZE = 24;
const STATUSES = new Set(["all", "approved", "pending", "rejected", "hidden"]);
const PROVIDERS = new Set(["all", "tiktok", "youtube", "instagram", "local"]);

function normalizePage(value: string | undefined): number {
  const page = Number(value ?? "1");
  if (!Number.isFinite(page)) return 1;
  return Math.max(1, Math.floor(page));
}

export async function getAdminVideosData(
  params: AdminVideoSearchParams,
): Promise<AdminVideosData> {
  const q = params.q?.trim() ?? "";
  const status = STATUSES.has(params.status ?? "") ? params.status ?? "all" : "all";
  const provider = PROVIDERS.has(params.provider ?? "") ? params.provider ?? "all" : "all";
  const page = normalizePage(params.page);

  const and: Prisma.VideoWhereInput[] = [];
  if (q) {
    and.push({
      OR: [
        { id: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { creator: { contains: q, mode: "insensitive" } },
        { sellerId: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { externalKey: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (status !== "all") and.push({ status });
  if (provider === "local") and.push({ externalProvider: null });
  else if (provider !== "all") and.push({ externalProvider: provider });

  const where: Prisma.VideoWhereInput = and.length ? { AND: and } : {};

  const [items, total, grouped] = await Promise.all([
    prisma.video.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        creator: true,
        sellerId: true,
        price: true,
        status: true,
        category: true,
        poster: true,
        src: true,
        sourcePageUrl: true,
        externalProvider: true,
        externalKey: true,
        createdAt: true,
      },
    }),
    prisma.video.count({ where }),
    prisma.video.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const row of grouped) statusCounts[row.status] = row._count._all;

  return {
    items: items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    q,
    status,
    provider,
    statusCounts,
  };
}
