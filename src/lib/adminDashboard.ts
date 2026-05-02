import type { PrismaClient } from "@prisma/client";

export type AdminKpi = {
  label: string;
  value: string;
  helper: string;
  tone: "cyan" | "green" | "amber" | "rose" | "slate";
};

export type AdminVideoRow = {
  id: string;
  title: string;
  creator: string;
  sellerId: string;
  price: number;
  views: number;
  salesCount: number;
  createdAt: string;
  poster: string;
};

export type AdminNotificationRow = {
  id: string;
  title: string;
  sellerId: string;
  oldPrice: number;
  newPrice: number;
  status: string;
  createdAt: string;
};

export type AdminGenerationJobs = {
  total: number;
  running: number;
  failed: number;
  succeeded: number;
};

export type AdminDashboardData = {
  kpis: AdminKpi[];
  recentVideos: AdminVideoRow[];
  pendingNotifications: AdminNotificationRow[];
  generationJobs: AdminGenerationJobs;
  system: {
    database: "ok" | "error";
    storagePolicy: "not_checked";
    aiJobs: "database";
    adminPolicy: "configured" | "development_preview";
  };
};

async function loadPrisma(): Promise<PrismaClient | null> {
  try {
    const mod = (await import("@/lib/prisma")) as { prisma?: PrismaClient };
    return mod.prisma ?? null;
  } catch (error) {
    console.error("[adminDashboard] prisma load failed", error);
    return null;
  }
}

function formatKrw(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value) + "won";
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function emptyData(input: { adminPolicyConfigured: boolean }): AdminDashboardData {
  return {
    kpis: [
      { label: "Database", value: "Error", helper: "Check Prisma connection", tone: "rose" },
      { label: "Videos", value: "-", helper: "Available after DB connects", tone: "slate" },
      { label: "Pending alerts", value: "-", helper: "Available after DB connects", tone: "slate" },
      { label: "AI Jobs", value: "-", helper: "Stored in generation_jobs", tone: "amber" },
    ],
    recentVideos: [],
    pendingNotifications: [],
    generationJobs: { total: 0, running: 0, failed: 0, succeeded: 0 },
    system: {
      database: "error",
      storagePolicy: "not_checked",
      aiJobs: "database",
      adminPolicy: input.adminPolicyConfigured ? "configured" : "development_preview",
    },
  };
}

export async function getAdminDashboardData(input: {
  adminPolicyConfigured: boolean;
}): Promise<AdminDashboardData> {
  const prisma = await loadPrisma();
  if (!prisma) return emptyData(input);

  try {
    const [
      totalVideos,
      totalNotifications,
      pendingNotificationsCount,
      generationJobCounts,
      aggregate,
      recentVideos,
      pendingNotifications,
    ] = await Promise.all([
      prisma.video.count(),
      prisma.notification.count(),
      prisma.notification.count({ where: { status: "PENDING" } }),
      prisma.generationJob.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.video.aggregate({
        _sum: { salesCount: true, views: true },
        _avg: { price: true },
      }),
      prisma.video.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          creator: true,
          sellerId: true,
          price: true,
          views: true,
          salesCount: true,
          createdAt: true,
          poster: true,
        },
      }),
      prisma.notification.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          sellerId: true,
          oldPrice: true,
          newPrice: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const generationJobs = generationJobCounts.reduce<AdminGenerationJobs>(
      (acc, row) => {
        const count = row._count._all;
        acc.total += count;
        if (row.status === "running") acc.running += count;
        if (row.status === "failed") acc.failed += count;
        if (row.status === "succeeded") acc.succeeded += count;
        return acc;
      },
      { total: 0, running: 0, failed: 0, succeeded: 0 },
    );

    const views = aggregate._sum.views ?? 0;
    const sales = aggregate._sum.salesCount ?? 0;
    const averagePrice = Math.round(aggregate._avg.price ?? 0);

    return {
      kpis: [
        {
          label: "Videos",
          value: formatNumber(totalVideos),
          helper: "Prisma videos table",
          tone: "cyan",
        },
        {
          label: "Total views",
          value: formatNumber(views),
          helper: "All video views",
          tone: "green",
        },
        {
          label: "Total sales",
          value: formatNumber(sales),
          helper: "Sum of salesCount",
          tone: "amber",
        },
        {
          label: "AI Jobs",
          value: formatNumber(generationJobs.total),
          helper: `${generationJobs.running} running, ${generationJobs.failed} failed`,
          tone: generationJobs.failed > 0 ? "rose" : "slate",
        },
        {
          label: "Average price",
          value: averagePrice > 0 ? formatKrw(averagePrice) : "-",
          helper: `${totalNotifications} alerts, ${pendingNotificationsCount} pending`,
          tone: pendingNotificationsCount > 0 ? "rose" : "slate",
        },
      ],
      recentVideos: recentVideos.map((video) => ({
        ...video,
        createdAt: video.createdAt.toISOString(),
      })),
      pendingNotifications: pendingNotifications.map((notification) => ({
        ...notification,
        createdAt: notification.createdAt.toISOString(),
      })),
      generationJobs,
      system: {
        database: "ok",
        storagePolicy: "not_checked",
        aiJobs: "database",
        adminPolicy: input.adminPolicyConfigured ? "configured" : "development_preview",
      },
    };
  } catch (error) {
    console.error("[adminDashboard] query failed", error);
    return emptyData(input);
  }
}
