import { prisma } from "@/lib/prisma";

// ─── Types ───────────────────────────────────────────────────

export type DailyStat = {
  date: string; // YYYY-MM-DD
  revenue: number;
  purchases: number;
  refunds: number;
  newUsers: number;
};

export type TopVideo = {
  videoId: string;
  title: string;
  creator: string;
  salesCount: number;
  totalRevenue: number;
};

export type TopSeller = {
  sellerId: string;
  email: string | null;
  nickname: string | null;
  totalSales: number;
  totalRevenue: number;
  netEarnings: number;
};

export type RevenueBreakdown = {
  totalRevenue: number;
  platformFees: number;
  sellerEarnings: number;
  refundedAmount: number;
  pendingSettlement: number;
  paidSettlement: number;
};

export type UserGrowth = {
  totalUsers: number;
  thisMonthNew: number;
  lastMonthNew: number;
  growthPercent: number;
};

export type PaymentProviderStats = {
  provider: string;
  count: number;
  totalAmount: number;
};

export type RefundStats = {
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
  refundRate: number; // percentage
};

export type CreditStats = {
  totalIssued: number;
  totalRefunded: number;
  currentCirculation: number;
};

export type AdminAnalyticsData = {
  dailyStats: DailyStat[];
  topVideos: TopVideo[];
  topSellers: TopSeller[];
  revenue: RevenueBreakdown;
  userGrowth: UserGrowth;
  providerStats: PaymentProviderStats[];
  refundStats: RefundStats;
  creditStats: CreditStats;
  todaySummary: {
    revenue: number;
    purchases: number;
    newUsers: number;
    activeJobs: number;
  };
};

// ─── Helpers ─────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(offset = 0): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + offset, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── Main Query ──────────────────────────────────────────────

export async function getAdminAnalytics(): Promise<AdminAnalyticsData> {
  const thirtyDaysAgo = daysAgo(30);
  const today = daysAgo(0);
  const thisMonthStart = startOfMonth(0);
  const lastMonthStart = startOfMonth(-1);

  const [
    // Payments in last 30 days
    recentPayments,
    // All-time revenue aggregates
    totalPaidPayments,
    totalRefundedPayments,
    // Platform fees
    platformFeesAgg,
    // Seller earnings breakdown
    earningsPending,
    earningsPaid,
    // Top videos by sales
    topVideoRows,
    // Top sellers by revenue
    topSellerRows,
    // User growth
    totalUserCount,
    thisMonthUsers,
    lastMonthUsers,
    // Refund stats
    refundRequestStats,
    totalPurchaseCount,
    // Credit stats
    creditPurchased,
    creditRefunded,
    creditCirculation,
    // Provider breakdown
    providerBreakdown,
    // Today stats
    todayPayments,
    todayPurchases,
    todayUsers,
    activeJobs,
  ] = await Promise.all([
    // Recent payments (last 30 days, paid)
    prisma.payment.findMany({
      where: { status: "paid", paidAt: { gte: thirtyDaysAgo } },
      select: { amountCents: true, paidAt: true, currency: true },
      orderBy: { paidAt: "asc" },
    }),
    // Total revenue
    prisma.payment.aggregate({
      where: { status: "paid" },
      _sum: { amountCents: true },
      _count: { _all: true },
    }),
    // Total refunded
    prisma.payment.aggregate({
      where: { status: "refunded" },
      _sum: { amountCents: true },
      _count: { _all: true },
    }),
    // Platform fees
    prisma.platformFee.aggregate({
      where: { status: "earned" },
      _sum: { amount: true },
    }),
    // Seller earnings pending
    prisma.sellerEarning.aggregate({
      where: { status: { in: ["pending", "settlement_requested"] } },
      _sum: { netAmount: true },
    }),
    // Seller earnings paid
    prisma.sellerEarning.aggregate({
      where: { status: "paid" },
      _sum: { netAmount: true },
    }),
    // Top videos
    prisma.video.findMany({
      where: { salesCount: { gt: 0 } },
      orderBy: { salesCount: "desc" },
      take: 10,
      select: { id: true, title: true, creator: true, salesCount: true, price: true },
    }),
    // Top sellers (by earnings)
    prisma.$queryRaw<
      { seller_id: string; total_sales: number; total_revenue: number; net_earnings: number }[]
    >`
      SELECT
        seller_id,
        count(*)::int AS total_sales,
        coalesce(sum(gross_amount), 0)::int AS total_revenue,
        coalesce(sum(net_amount), 0)::int AS net_earnings
      FROM seller_earnings
      GROUP BY seller_id
      ORDER BY total_revenue DESC
      LIMIT 10
    `,
    // User counts
    prisma.$queryRaw<{ count: number }[]>`SELECT count(*)::int AS count FROM public.profiles`,
    prisma.$queryRaw<{ count: number }[]>`
      SELECT count(*)::int AS count FROM public.profiles
      WHERE updated_at >= ${thisMonthStart}
    `,
    prisma.$queryRaw<{ count: number }[]>`
      SELECT count(*)::int AS count FROM public.profiles
      WHERE updated_at >= ${lastMonthStart} AND updated_at < ${thisMonthStart}
    `,
    // Refund request stats
    prisma.refundRequest.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    // Total purchases for refund rate
    prisma.purchase.count(),
    // Credit stats
    prisma.creditLedger.aggregate({
      where: { type: "purchase" },
      _sum: { amount: true },
    }),
    prisma.creditLedger.aggregate({
      where: { type: "refund" },
      _sum: { amount: true },
    }),
    prisma.userCreditBalance.aggregate({
      _sum: { balance: true },
    }),
    // Provider breakdown
    prisma.payment.groupBy({
      by: ["provider"],
      where: { status: "paid" },
      _count: { _all: true },
      _sum: { amountCents: true },
    }),
    // Today stats
    prisma.payment.aggregate({
      where: { status: "paid", paidAt: { gte: today } },
      _sum: { amountCents: true },
      _count: { _all: true },
    }),
    prisma.purchase.count({
      where: { createdAt: { gte: today } },
    }),
    prisma.$queryRaw<{ count: number }[]>`
      SELECT count(*)::int AS count FROM public.profiles
      WHERE updated_at >= ${today}
    `,
    prisma.generationJob.count({
      where: { status: { in: ["queued", "processing"] } },
    }),
  ]);

  // ─── Build daily stats ───

  const dailyMap = new Map<string, DailyStat>();

  // Init 30 days
  for (let i = 29; i >= 0; i--) {
    const key = toDateKey(daysAgo(i));
    dailyMap.set(key, { date: key, revenue: 0, purchases: 0, refunds: 0, newUsers: 0 });
  }

  // Fill payment revenue
  for (const p of recentPayments) {
    if (!p.paidAt) continue;
    const key = toDateKey(p.paidAt);
    const day = dailyMap.get(key);
    if (day) {
      day.revenue += p.amountCents;
      day.purchases += 1;
    }
  }

  const dailyStats = Array.from(dailyMap.values());

  // ─── Revenue breakdown ───

  const totalRevenue = totalPaidPayments._sum.amountCents ?? 0;
  const refundedAmount = totalRefundedPayments._sum.amountCents ?? 0;
  const platformFees = platformFeesAgg._sum.amount ?? 0;
  const pendingSettlement = earningsPending._sum.netAmount ?? 0;
  const paidSettlement = earningsPaid._sum.netAmount ?? 0;

  // ─── Top videos ───

  const topVideos: TopVideo[] = topVideoRows.map((v) => ({
    videoId: v.id,
    title: v.title,
    creator: v.creator,
    salesCount: v.salesCount,
    totalRevenue: v.salesCount * v.price,
  }));

  // ─── Top sellers ───

  // Enrich with profile data
  const sellerIds = topSellerRows.map((s) => s.seller_id);
  const sellerProfiles = sellerIds.length > 0
    ? await prisma.$queryRaw<{ user_id: string; email: string | null; nickname: string | null }[]>`
        SELECT user_id::text, email, nickname
        FROM public.profiles
        WHERE user_id::text = ANY(${sellerIds})
      `
    : [];
  const profileMap = new Map(sellerProfiles.map((p) => [p.user_id, p]));

  const topSellers: TopSeller[] = topSellerRows.map((s) => {
    const profile = profileMap.get(s.seller_id);
    return {
      sellerId: s.seller_id,
      email: profile?.email ?? null,
      nickname: profile?.nickname ?? null,
      totalSales: Number(s.total_sales),
      totalRevenue: Number(s.total_revenue),
      netEarnings: Number(s.net_earnings),
    };
  });

  // ─── User growth ───

  const totalUsers = totalUserCount[0]?.count ?? 0;
  const thisMonthNew = thisMonthUsers[0]?.count ?? 0;
  const lastMonthNew = lastMonthUsers[0]?.count ?? 0;
  const growthPercent =
    lastMonthNew > 0 ? Math.round(((thisMonthNew - lastMonthNew) / lastMonthNew) * 100) : 0;

  // ─── Refund stats ───

  const refundCounts: Record<string, number> = {};
  for (const row of refundRequestStats) {
    refundCounts[row.status] = row._count._all;
  }
  const totalRefundRequests = Object.values(refundCounts).reduce((a, b) => a + b, 0);
  const approvedRefunds = (refundCounts.refunded ?? 0);
  const refundRate =
    totalPurchaseCount > 0 ? Math.round((approvedRefunds / totalPurchaseCount) * 10000) / 100 : 0;

  // ─── Credit stats ───

  const totalIssued = creditPurchased._sum.amount ?? 0;
  const totalCreditRefunded = Math.abs(creditRefunded._sum.amount ?? 0);
  const currentCirculation = creditCirculation._sum.balance ?? 0;

  // ─── Provider stats ───

  const providerStats: PaymentProviderStats[] = providerBreakdown.map((p) => ({
    provider: p.provider,
    count: p._count._all,
    totalAmount: p._sum.amountCents ?? 0,
  }));

  return {
    dailyStats,
    topVideos,
    topSellers,
    revenue: {
      totalRevenue,
      platformFees,
      sellerEarnings: pendingSettlement + paidSettlement,
      refundedAmount,
      pendingSettlement,
      paidSettlement,
    },
    userGrowth: { totalUsers, thisMonthNew, lastMonthNew, growthPercent },
    providerStats,
    refundStats: {
      totalRequests: totalRefundRequests,
      pending: (refundCounts.requested ?? 0) + (refundCounts.reviewing ?? 0),
      approved: approvedRefunds,
      rejected: refundCounts.rejected ?? 0,
      refundRate,
    },
    creditStats: {
      totalIssued,
      totalRefunded: totalCreditRefunded,
      currentCirculation,
    },
    todaySummary: {
      revenue: todayPayments._sum.amountCents ?? 0,
      purchases: todayPurchases,
      newUsers: todayUsers[0]?.count ?? 0,
      activeJobs: activeJobs,
    },
  };
}
