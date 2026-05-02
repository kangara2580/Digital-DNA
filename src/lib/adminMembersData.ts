import { prisma } from "@/lib/prisma";
import { ensureProfileAdminColumns } from "@/lib/ensureProfileAdminColumns";

export type AdminMembersSearchParams = {
  q?: string;
  status?: string;
  role?: string;
  page?: string;
  userId?: string;
};

export type AdminMemberListItem = {
  userId: string;
  email: string | null;
  nickname: string | null;
  phone: string | null;
  country: string | null;
  avatar: string | null;
  accountStatus: string;
  role: string;
  adminMemo: string | null;
  suspendedAt: string | null;
  updatedAt: string | null;
  purchasesCount: number;
  purchasesTotal: number;
  jobsCount: number;
  reportsCount: number;
  videosCount: number;
};

export type AdminMemberDetail = AdminMemberListItem & {
  recentPurchases: {
    id: string;
    videoId: string;
    price: number;
    status: string;
    createdAt: string;
  }[];
  recentJobs: {
    id: string;
    status: string;
    stage: string;
    progress: number;
    outputUrl: string | null;
    errorMessage: string | null;
    updatedAt: string;
  }[];
  recentReports: {
    id: string;
    targetType: string;
    targetId: string;
    reason: string;
    status: string;
    createdAt: string;
  }[];
  recentVideos: {
    id: string;
    title: string;
    status: string;
    price: number;
    createdAt: string;
  }[];
  recentNotes: {
    id: string;
    body: string;
    createdBy: string;
    createdAt: string;
  }[];
};

export type AdminMembersData = {
  items: AdminMemberListItem[];
  selected: AdminMemberDetail | null;
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  q: string;
  status: string;
  role: string;
  statusCounts: Record<string, number>;
  roleCounts: Record<string, number>;
};

type ProfileRow = {
  user_id: string;
  email: string | null;
  nickname: string | null;
  phone: string | null;
  country: string | null;
  avatar_custom: string | null;
  account_status: string;
  role: string;
  admin_memo: string | null;
  suspended_at: Date | null;
  updated_at: Date | null;
  purchases_count: number;
  purchases_total: number;
  jobs_count: number;
  reports_count: number;
  videos_count: number;
};

const PAGE_SIZE = 30;
const STATUSES = new Set(["all", "active", "suspended", "deleted"]);
const ROLES = new Set(["all", "user", "seller", "admin", "super_admin"]);

function normalizePage(value: string | undefined): number {
  const page = Number(value ?? "1");
  if (!Number.isFinite(page)) return 1;
  return Math.max(1, Math.floor(page));
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function likeTerm(q: string): string {
  return `%${q.replace(/[%_]/g, "\\$&")}%`;
}

function rowToItem(row: ProfileRow): AdminMemberListItem {
  return {
    userId: row.user_id,
    email: row.email,
    nickname: row.nickname,
    phone: row.phone,
    country: row.country,
    avatar: row.avatar_custom,
    accountStatus: row.account_status,
    role: row.role,
    adminMemo: row.admin_memo,
    suspendedAt: toIso(row.suspended_at),
    updatedAt: toIso(row.updated_at),
    purchasesCount: row.purchases_count,
    purchasesTotal: row.purchases_total,
    jobsCount: row.jobs_count,
    reportsCount: row.reports_count,
    videosCount: row.videos_count,
  };
}

async function fetchMemberRows(input: {
  q: string;
  status: string;
  role: string;
  page: number;
}): Promise<ProfileRow[]> {
  const q = input.q ? likeTerm(input.q) : "";
  const offset = (input.page - 1) * PAGE_SIZE;

  return prisma.$queryRaw<ProfileRow[]>`
    select
      p.user_id::text,
      p.email,
      p.nickname,
      p.phone,
      p.country,
      p.avatar_custom,
      p.account_status,
      p.role,
      p.admin_memo,
      p.suspended_at,
      p.updated_at,
      coalesce(pu.purchases_count, 0)::int as purchases_count,
      coalesce(pu.purchases_total, 0)::int as purchases_total,
      coalesce(j.jobs_count, 0)::int as jobs_count,
      coalesce(r.reports_count, 0)::int as reports_count,
      coalesce(v.videos_count, 0)::int as videos_count
    from public.profiles p
    left join (
      select buyer_id, count(*)::int as purchases_count, coalesce(sum(price), 0)::int as purchases_total
      from public.purchases
      group by buyer_id
    ) pu on pu.buyer_id = p.user_id::text
    left join (
      select user_id, count(*)::int as jobs_count
      from public.generation_jobs
      group by user_id
    ) j on j.user_id = p.user_id::text
    left join (
      select reporter_id, count(*)::int as reports_count
      from public.reports
      where reporter_id is not null
      group by reporter_id
    ) r on r.reporter_id = p.user_id::text
    left join (
      select seller_id, count(*)::int as videos_count
      from public.videos
      group by seller_id
    ) v on v.seller_id = p.user_id::text
    where
      (${input.status} = 'all' or p.account_status = ${input.status})
      and (${input.role} = 'all' or p.role = ${input.role})
      and (
        ${q} = ''
        or p.user_id::text ilike ${q}
        or coalesce(p.email, '') ilike ${q}
        or coalesce(p.nickname, '') ilike ${q}
        or coalesce(p.phone, '') ilike ${q}
      )
    order by p.updated_at desc nulls last
    limit ${PAGE_SIZE}
    offset ${offset}
  `;
}

async function fetchMemberTotal(input: {
  q: string;
  status: string;
  role: string;
}): Promise<number> {
  const q = input.q ? likeTerm(input.q) : "";
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    select count(*)::int as count
    from public.profiles p
    where
      (${input.status} = 'all' or p.account_status = ${input.status})
      and (${input.role} = 'all' or p.role = ${input.role})
      and (
        ${q} = ''
        or p.user_id::text ilike ${q}
        or coalesce(p.email, '') ilike ${q}
        or coalesce(p.nickname, '') ilike ${q}
        or coalesce(p.phone, '') ilike ${q}
      )
  `;
  return rows[0]?.count ?? 0;
}

async function fetchSelectedMember(userId: string | undefined): Promise<AdminMemberDetail | null> {
  if (!userId) return null;
  const rows = await fetchMemberRows({ q: userId, status: "all", role: "all", page: 1 });
  const base = rows.find((row) => row.user_id === userId);
  if (!base) return null;

  const [recentPurchases, recentJobs, recentReports, recentVideos, recentNotes] =
    await Promise.all([
      prisma.purchase.findMany({
        where: { buyerId: userId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, videoId: true, price: true, status: true, createdAt: true },
      }),
      prisma.generationJob.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          status: true,
          stage: true,
          progress: true,
          outputUrl: true,
          errorMessage: true,
          updatedAt: true,
        },
      }),
      prisma.report.findMany({
        where: { reporterId: userId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          targetType: true,
          targetId: true,
          reason: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.video.findMany({
        where: { sellerId: userId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, title: true, status: true, price: true, createdAt: true },
      }),
      prisma.adminNote.findMany({
        where: { targetType: "member", targetId: userId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, body: true, createdBy: true, createdAt: true },
      }),
    ]);

  return {
    ...rowToItem(base),
    recentPurchases: recentPurchases.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
    recentJobs: recentJobs.map((item) => ({
      ...item,
      updatedAt: item.updatedAt.toISOString(),
    })),
    recentReports: recentReports.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
    recentVideos: recentVideos.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
    recentNotes: recentNotes.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}

export async function getAdminMembersData(
  params: AdminMembersSearchParams,
): Promise<AdminMembersData> {
  await ensureProfileAdminColumns();

  const q = params.q?.trim() ?? "";
  const status = STATUSES.has(params.status ?? "") ? params.status ?? "all" : "all";
  const role = ROLES.has(params.role ?? "") ? params.role ?? "all" : "all";
  const page = normalizePage(params.page);

  const [items, total, statusGrouped, roleGrouped, selected] = await Promise.all([
    fetchMemberRows({ q, status, role, page }),
    fetchMemberTotal({ q, status, role }),
    prisma.$queryRaw<{ account_status: string; count: number }[]>`
      select account_status, count(*)::int as count
      from public.profiles
      group by account_status
    `,
    prisma.$queryRaw<{ role: string; count: number }[]>`
      select role, count(*)::int as count
      from public.profiles
      group by role
    `,
    fetchSelectedMember(params.userId),
  ]);

  return {
    items: items.map(rowToItem),
    selected,
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    q,
    status,
    role,
    statusCounts: Object.fromEntries(
      statusGrouped.map((row) => [row.account_status, row.count]),
    ),
    roleCounts: Object.fromEntries(roleGrouped.map((row) => [row.role, row.count])),
  };
}
