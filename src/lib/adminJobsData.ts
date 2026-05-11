import { prisma } from "@/lib/prisma";

export type AdminJobsSearchParams = {
  status?: string;
  page?: string;
};

export type AdminJobListItem = {
  id: string;
  userId: string;
  sourceVideoId: string | null;
  status: string;
  stage: string;
  progress: number;
  outputUrl: string | null;
  errorMessage: string | null;
  updatedAt: string;
};

export type AdminJobsData = {
  items: AdminJobListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  status: string;
  statusCounts: Record<string, number>;
};

const PAGE_SIZE = 30;
const STATUSES = new Set(["all", "queued", "running", "succeeded", "failed"]);

function normalizePage(value: string | undefined): number {
  const page = Number(value ?? "1");
  if (!Number.isFinite(page)) return 1;
  return Math.max(1, Math.floor(page));
}

export async function getAdminJobsData(
  params: AdminJobsSearchParams,
): Promise<AdminJobsData> {
  const status = STATUSES.has(params.status ?? "") ? params.status ?? "all" : "all";
  const page = normalizePage(params.page);
  const where = status === "all" ? {} : { status };

  const [items, total, grouped] = await Promise.all([
    prisma.generationJob.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        userId: true,
        sourceVideoId: true,
        status: true,
        stage: true,
        progress: true,
        outputUrl: true,
        errorMessage: true,
        updatedAt: true,
      },
    }),
    prisma.generationJob.count({ where }),
    prisma.generationJob.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const row of grouped) statusCounts[row.status] = row._count._all;

  return {
    items: items.map((item) => ({
      ...item,
      updatedAt: item.updatedAt.toISOString(),
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    status,
    statusCounts,
  };
}
