import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AdminPurchasesSearchParams = {
  q?: string;
  status?: string;
  page?: string;
};

export type AdminPurchaseListItem = {
  id: string;
  buyerId: string;
  buyerEmail: string | null;
  buyerNickname: string | null;
  sellerId: string;
  sellerEmail: string | null;
  videoId: string;
  videoTitle: string | null;
  price: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminPurchasesData = {
  items: AdminPurchaseListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  q: string;
  status: string;
  statusCounts: Record<string, number>;
  totalPaidAmount: number;
};

const PAGE_SIZE = 30;
const STATUSES = new Set(["all", "paid", "refunded", "canceled"]);

function normalizePage(value: string | undefined): number {
  const page = Number(value ?? "1");
  if (!Number.isFinite(page)) return 1;
  return Math.max(1, Math.floor(page));
}

export async function getAdminPurchasesData(
  params: AdminPurchasesSearchParams,
): Promise<AdminPurchasesData> {
  const q = params.q?.trim() ?? "";
  const status = STATUSES.has(params.status ?? "") ? params.status ?? "all" : "all";
  const page = normalizePage(params.page);

  const and: Prisma.PurchaseWhereInput[] = [];
  if (status !== "all") and.push({ status });
  if (q) {
    and.push({
      OR: [
        { id: { contains: q, mode: "insensitive" } },
        { buyerId: { contains: q, mode: "insensitive" } },
        { sellerId: { contains: q, mode: "insensitive" } },
        { videoId: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  const where: Prisma.PurchaseWhereInput = and.length ? { AND: and } : {};

  const [purchases, total, grouped, paidAggregate] = await Promise.all([
    prisma.purchase.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        videoId: true,
        price: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.purchase.count({ where }),
    prisma.purchase.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.purchase.aggregate({
      where: { status: "paid" },
      _sum: { price: true },
    }),
  ]);

  const buyerIds = [...new Set(purchases.map((item) => item.buyerId))];
  const sellerIds = [...new Set(purchases.map((item) => item.sellerId))];
  const videoIds = [...new Set(purchases.map((item) => item.videoId))];
  const profileIds = [...new Set([...buyerIds, ...sellerIds])];

  const [profiles, videos] = await Promise.all([
    profileIds.length
      ? prisma.$queryRaw<
          { user_id: string; email: string | null; nickname: string | null }[]
        >`
          select user_id::text, email, nickname
          from public.profiles
          where user_id::text in (${Prisma.join(profileIds)})
        `
      : Promise.resolve([]),
    videoIds.length
      ? prisma.video.findMany({
          where: { id: { in: videoIds } },
          select: { id: true, title: true },
        })
      : Promise.resolve([]),
  ]);

  const profileMap = new Map(profiles.map((item) => [item.user_id, item]));
  const videoMap = new Map(videos.map((item) => [item.id, item]));

  return {
    items: purchases.map((item) => {
      const buyer = profileMap.get(item.buyerId);
      const seller = profileMap.get(item.sellerId);
      const video = videoMap.get(item.videoId);
      return {
        id: item.id,
        buyerId: item.buyerId,
        buyerEmail: buyer?.email ?? null,
        buyerNickname: buyer?.nickname ?? null,
        sellerId: item.sellerId,
        sellerEmail: seller?.email ?? null,
        videoId: item.videoId,
        videoTitle: video?.title ?? null,
        price: item.price,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      };
    }),
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    q,
    status,
    statusCounts: Object.fromEntries(
      grouped.map((item) => [item.status, item._count._all]),
    ),
    totalPaidAmount: paidAggregate._sum.price ?? 0,
  };
}
