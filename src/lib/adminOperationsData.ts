import { prisma } from "@/lib/prisma";

export type AdminMetric = {
  label: string;
  value: string;
  helper: string;
};

export type AdminMember = {
  userId: string;
  email: string | null;
  nickname: string | null;
  phone: string | null;
  country: string | null;
  avatar: string | null;
  updatedAt: string | null;
};

export type AdminMedia = {
  id: string;
  title: string;
  creator: string;
  sellerId: string;
  price: number;
  status: string;
  reason: string | null;
  poster: string;
  src: string;
  category: string | null;
  description: string | null;
  sourcePageUrl: string | null;
  externalProvider: string | null;
  externalKey: string | null;
  createdAt: string;
};

export type AdminPurchase = {
  id: string;
  buyerId: string;
  sellerId: string;
  videoId: string;
  price: number;
  status: string;
  createdAt: string;
};

export type AdminJob = {
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

export type AdminReport = {
  id: string;
  reporterId: string | null;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
};

export type AdminAuditRow = {
  id: string;
  actorEmail: string | null;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
};

export type AdminBlobRow = {
  userId: string;
  blobKey: string;
  updatedAt: string | null;
};

export type AdminNoteRow = {
  id: string;
  targetType: string;
  targetId: string;
  body: string;
  createdBy: string;
  createdAt: string;
};

export type AdminChangeRow = {
  id: string;
  targetType: string;
  targetId: string;
  actorType: string;
  changeType: string;
  createdAt: string;
};

export type AdminOperationsData = {
  metrics: AdminMetric[];
  members: AdminMember[];
  media: AdminMedia[];
  purchases: AdminPurchase[];
  jobs: AdminJob[];
  reports: AdminReport[];
  audits: AdminAuditRow[];
  blobs: AdminBlobRow[];
  notes: AdminNoteRow[];
  changes: AdminChangeRow[];
};

type ProfileRow = {
  user_id: string;
  email: string | null;
  nickname: string | null;
  phone: string | null;
  country: string | null;
  avatar_custom: string | null;
  updated_at: Date | null;
};

type BlobRow = {
  user_id: string;
  blob_key: string;
  updated_at: Date | null;
};

function numberText(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function wonText(value: number): string {
  return `${numberText(value)}원`;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function getAdminOperationsData(): Promise<AdminOperationsData> {
  const [
    memberCountRows,
    blobCountRows,
    members,
    blobs,
    videos,
    purchases,
    jobs,
    reports,
    audits,
    notes,
    changes,
    purchaseAggregate,
  ] = await Promise.all([
    prisma.$queryRaw<{ count: number }[]>`select count(*)::int as count from public.profiles`,
    prisma.$queryRaw<{ count: number }[]>`select count(*)::int as count from public.user_data_blobs`,
    prisma.$queryRaw<ProfileRow[]>`
      select user_id::text, email, nickname, phone, country, avatar_custom, updated_at
      from public.profiles
      order by updated_at desc nulls last
      limit 12
    `,
    prisma.$queryRaw<BlobRow[]>`
      select user_id::text, blob_key, updated_at
      from public.user_data_blobs
      order by updated_at desc nulls last
      limit 12
    `,
    prisma.video.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        creator: true,
        sellerId: true,
        price: true,
        status: true,
        moderationReason: true,
        poster: true,
        src: true,
        category: true,
        description: true,
        sourcePageUrl: true,
        externalProvider: true,
        externalKey: true,
        createdAt: true,
      },
    }),
    prisma.purchase.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        videoId: true,
        price: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.generationJob.findMany({
      orderBy: { updatedAt: "desc" },
      take: 12,
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
    prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        reporterId: true,
        targetType: true,
        targetId: true,
        reason: true,
        status: true,
        adminNote: true,
        createdAt: true,
      },
    }),
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        actorEmail: true,
        action: true,
        targetType: true,
        targetId: true,
        createdAt: true,
      },
    }),
    prisma.adminNote.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        targetType: true,
        targetId: true,
        body: true,
        createdBy: true,
        createdAt: true,
      },
    }),
    prisma.contentChangeLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        targetType: true,
        targetId: true,
        actorType: true,
        changeType: true,
        createdAt: true,
      },
    }),
    prisma.purchase.aggregate({
      _sum: { price: true },
      _count: { _all: true },
    }),
  ]);

  const memberCount = memberCountRows[0]?.count ?? 0;
  const blobCount = blobCountRows[0]?.count ?? 0;
  const purchaseTotal = purchaseAggregate._sum.price ?? 0;

  return {
    metrics: [
      { label: "회원", value: numberText(memberCount), helper: "profiles 기준" },
      { label: "이미지/영상", value: numberText(videos.length), helper: "최근 12개 표시" },
      { label: "구매", value: numberText(purchaseAggregate._count._all), helper: wonText(purchaseTotal) },
      { label: "AI 작업", value: numberText(jobs.length), helper: "최근 작업 기준" },
      { label: "신고", value: numberText(reports.length), helper: "최근 신고 기준" },
      { label: "저장 데이터", value: numberText(blobCount), helper: "user_data_blobs 기준" },
    ],
    members: members.map((row) => ({
      userId: row.user_id,
      email: row.email,
      nickname: row.nickname,
      phone: row.phone,
      country: row.country,
      avatar: row.avatar_custom,
      updatedAt: toIso(row.updated_at),
    })),
    blobs: blobs.map((row) => ({
      userId: row.user_id,
      blobKey: row.blob_key,
      updatedAt: toIso(row.updated_at),
    })),
    media: videos.map((video) => ({
      id: video.id,
      title: video.title,
      creator: video.creator,
      sellerId: video.sellerId,
      price: video.price,
      status: video.status,
      reason: video.moderationReason,
      poster: video.poster,
      src: video.src,
      category: video.category,
      description: video.description,
      sourcePageUrl: video.sourcePageUrl,
      externalProvider: video.externalProvider,
      externalKey: video.externalKey,
      createdAt: video.createdAt.toISOString(),
    })),
    purchases: purchases.map((purchase) => ({
      ...purchase,
      createdAt: purchase.createdAt.toISOString(),
    })),
    jobs: jobs.map((job) => ({
      ...job,
      updatedAt: job.updatedAt.toISOString(),
    })),
    reports: reports.map((report) => ({
      ...report,
      createdAt: report.createdAt.toISOString(),
    })),
    audits: audits.map((audit) => ({
      ...audit,
      createdAt: audit.createdAt.toISOString(),
    })),
    notes: notes.map((note) => ({
      ...note,
      createdAt: note.createdAt.toISOString(),
    })),
    changes: changes.map((change) => ({
      ...change,
      createdAt: change.createdAt.toISOString(),
    })),
  };
}
