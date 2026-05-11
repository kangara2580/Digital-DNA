import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AdminReportsSearchParams = {
  q?: string;
  status?: string;
  targetType?: string;
  page?: string;
};

export type AdminReportListItem = {
  id: string;
  reporterId: string | null;
  reporterEmail: string | null;
  reporterNickname: string | null;
  targetType: string;
  targetId: string;
  targetTitle: string | null;
  reason: string;
  status: string;
  adminNote: string | null;
  assignedAdminId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminReportsData = {
  items: AdminReportListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  q: string;
  status: string;
  targetType: string;
  statusCounts: Record<string, number>;
  targetTypeCounts: Record<string, number>;
};

const PAGE_SIZE = 30;
const STATUSES = new Set(["all", "open", "reviewing", "resolved", "dismissed"]);
const TARGET_TYPES = new Set(["all", "video", "member", "purchase", "job"]);

function normalizePage(value: string | undefined): number {
  const page = Number(value ?? "1");
  if (!Number.isFinite(page)) return 1;
  return Math.max(1, Math.floor(page));
}

export async function getAdminReportsData(
  params: AdminReportsSearchParams,
): Promise<AdminReportsData> {
  const q = params.q?.trim() ?? "";
  const status = STATUSES.has(params.status ?? "") ? params.status ?? "all" : "all";
  const targetType = TARGET_TYPES.has(params.targetType ?? "")
    ? params.targetType ?? "all"
    : "all";
  const page = normalizePage(params.page);

  const and: Prisma.ReportWhereInput[] = [];
  if (status !== "all") and.push({ status });
  if (targetType !== "all") and.push({ targetType });
  if (q) {
    and.push({
      OR: [
        { id: { contains: q, mode: "insensitive" } },
        { reporterId: { contains: q, mode: "insensitive" } },
        { targetType: { contains: q, mode: "insensitive" } },
        { targetId: { contains: q, mode: "insensitive" } },
        { reason: { contains: q, mode: "insensitive" } },
        { adminNote: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  const where: Prisma.ReportWhereInput = and.length ? { AND: and } : {};

  const [reports, total, groupedByStatus, groupedByTargetType] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        reporterId: true,
        targetType: true,
        targetId: true,
        reason: true,
        status: true,
        adminNote: true,
        assignedAdminId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.report.count({ where }),
    prisma.report.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.report.groupBy({
      by: ["targetType"],
      _count: { _all: true },
    }),
  ]);

  const reporterIds = [
    ...new Set(reports.map((item) => item.reporterId).filter(Boolean) as string[]),
  ];
  const videoTargetIds = [
    ...new Set(
      reports
        .filter((item) => item.targetType === "video")
        .map((item) => item.targetId),
    ),
  ];

  const [profiles, videos] = await Promise.all([
    reporterIds.length
      ? prisma.$queryRaw<
          { user_id: string; email: string | null; nickname: string | null }[]
        >`
          select user_id::text, email, nickname
          from public.profiles
          where user_id::text in (${Prisma.join(reporterIds)})
        `
      : Promise.resolve([]),
    videoTargetIds.length
      ? prisma.video.findMany({
          where: { id: { in: videoTargetIds } },
          select: { id: true, title: true },
        })
      : Promise.resolve([]),
  ]);

  const profileMap = new Map(profiles.map((item) => [item.user_id, item]));
  const videoMap = new Map(videos.map((item) => [item.id, item]));

  return {
    items: reports.map((item) => {
      const reporter = item.reporterId ? profileMap.get(item.reporterId) : null;
      return {
        id: item.id,
        reporterId: item.reporterId,
        reporterEmail: reporter?.email ?? null,
        reporterNickname: reporter?.nickname ?? null,
        targetType: item.targetType,
        targetId: item.targetId,
        targetTitle: videoMap.get(item.targetId)?.title ?? null,
        reason: item.reason,
        status: item.status,
        adminNote: item.adminNote,
        assignedAdminId: item.assignedAdminId,
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
    targetType,
    statusCounts: Object.fromEntries(
      groupedByStatus.map((item) => [item.status, item._count._all]),
    ),
    targetTypeCounts: Object.fromEntries(
      groupedByTargetType.map((item) => [item.targetType, item._count._all]),
    ),
  };
}
