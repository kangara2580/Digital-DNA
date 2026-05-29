import { getMarketVideoById } from "@/data/videoCommerce";
import { prisma } from "@/lib/prisma";
import { hasPaidPurchase } from "@/lib/purchases";
import type { ReviewAuthorProfile } from "@/lib/reviewAuthorProfileShared";
import {
  buildReviewAuthorProfile,
  loadReviewAuthorProfiles,
} from "@/lib/reviewAuthorProfiles";

export { REVIEW_BODY_MAX, REVIEW_BODY_MIN } from "@/lib/reviewConstants";

type ReviewableVideoMeta = {
  id: string;
  title: string;
  poster: string;
  creator: string;
  sellerId: string;
};

function resolveReviewableVideoMeta(
  videoId: string,
  rowById: Map<string, ReviewableVideoMeta>,
): ReviewableVideoMeta | null {
  const row = rowById.get(videoId);
  if (row) return row;

  const catalog = getMarketVideoById(videoId);
  if (catalog) {
    return {
      id: catalog.id,
      title: catalog.title,
      poster: catalog.poster,
      creator: catalog.creator,
      sellerId: catalog.listing?.sellerId?.trim() ?? "",
    };
  }

  return {
    id: videoId,
    title: videoId,
    poster: `https://picsum.photos/seed/${encodeURIComponent(videoId)}/720/1280`,
    creator: "—",
    sellerId: "",
  };
}

export type ReviewSort = "latest" | "rating";

export type PublicReviewRow = {
  id: string;
  videoId: string;
  userId: string;
  nickname: string;
  rating: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  sellerReply: string | null;
  sellerReplyAt: string | null;
  sellerReplyUpdatedAt: string | null;
  isReported: boolean;
  author: ReviewAuthorProfile;
};

export type ReviewStats = {
  count: number;
  averageRating: number | null;
};

function mapReview(
  row: {
    id: string;
    videoId: string;
    userId: string;
    nickname: string;
    rating: number;
    body: string;
    createdAt: Date;
    updatedAt: Date;
    sellerReply: string | null;
    sellerReplyAt: Date | null;
    sellerReplyUpdatedAt: Date | null;
    isReported: boolean;
  },
  author: ReviewAuthorProfile,
): PublicReviewRow {
  return {
    id: row.id,
    videoId: row.videoId,
    userId: row.userId,
    nickname: row.nickname,
    rating: row.rating,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    sellerReply: row.sellerReply,
    sellerReplyAt: row.sellerReplyAt?.toISOString() ?? null,
    sellerReplyUpdatedAt: row.sellerReplyUpdatedAt?.toISOString() ?? null,
    isReported: row.isReported,
    author,
  };
}

async function attachAuthors(rows: Array<{
  userId: string;
  nickname: string;
}>): Promise<Map<string, ReviewAuthorProfile>> {
  const nicknameByUserId = new Map(rows.map((r) => [r.userId, r.nickname]));
  return loadReviewAuthorProfiles(
    [...nicknameByUserId.keys()],
    nicknameByUserId,
  );
}

export async function listVideoReviews(
  videoId: string,
  sort: ReviewSort = "latest",
): Promise<{ reviews: PublicReviewRow[]; stats: ReviewStats }> {
  const orderBy =
    sort === "rating"
      ? [{ rating: "desc" as const }, { createdAt: "desc" as const }]
      : [{ createdAt: "desc" as const }];

  const rows = await prisma.videoReview.findMany({
    where: { videoId },
    orderBy,
    take: 100,
  });

  const agg = await prisma.videoReview.aggregate({
    where: { videoId },
    _count: { _all: true },
    _avg: { rating: true },
  });

  const authors = await attachAuthors(rows);
  return {
    reviews: rows.map((row) =>
      mapReview(
        row,
        authors.get(row.userId) ??
          buildReviewAuthorProfile(row.userId, row.nickname, null),
      ),
    ),
    stats: {
      count: agg._count._all,
      averageRating: agg._avg.rating ?? null,
    },
  };
}

export async function getUserReviewForVideo(
  userId: string,
  videoId: string,
): Promise<PublicReviewRow | null> {
  const row = await prisma.videoReview.findUnique({
    where: { videoId_userId: { videoId, userId } },
  });
  if (!row) return null;
  const authors = await attachAuthors([row]);
  return mapReview(
    row,
    authors.get(row.userId) ??
      buildReviewAuthorProfile(row.userId, row.nickname, null),
  );
}

export async function upsertVideoReview(params: {
  videoId: string;
  userId: string;
  nickname: string;
  rating: number;
  body: string;
}): Promise<PublicReviewRow> {
  const row = await prisma.videoReview.upsert({
    where: {
      videoId_userId: { videoId: params.videoId, userId: params.userId },
    },
    create: {
      videoId: params.videoId,
      userId: params.userId,
      nickname: params.nickname,
      rating: params.rating,
      body: params.body,
    },
    update: {
      nickname: params.nickname,
      rating: params.rating,
      body: params.body,
    },
  });
  const authors = await attachAuthors([row]);
  return mapReview(
    row,
    authors.get(row.userId) ??
      buildReviewAuthorProfile(row.userId, row.nickname, null),
  );
}

export async function deleteUserReview(
  userId: string,
  videoId: string,
): Promise<boolean> {
  const result = await prisma.videoReview.deleteMany({
    where: { videoId, userId },
  });
  return result.count > 0;
}

export async function assertBuyerCanReview(
  userId: string,
  videoId: string,
): Promise<boolean> {
  return hasPaidPurchase({ userId, videoId });
}

export async function listReviewablePurchases(userId: string) {
  const purchases = await prisma.purchase.findMany({
    where: { buyerId: userId, status: "paid" },
    orderBy: { createdAt: "desc" },
  });

  type Row = { videoId: string; acquiredAt: Date; price: number };
  const byVideo = new Map<string, Row>();

  for (const p of purchases) {
    const prev = byVideo.get(p.videoId);
    if (!prev || p.createdAt > prev.acquiredAt) {
      byVideo.set(p.videoId, {
        videoId: p.videoId,
        acquiredAt: p.createdAt,
        price: p.price,
      });
    }
  }

  const videoIds = [...byVideo.keys()];
  if (videoIds.length === 0) return [];

  const videoRows = await prisma.video.findMany({
    where: { id: { in: videoIds } },
    select: {
      id: true,
      title: true,
      poster: true,
      creator: true,
      sellerId: true,
    },
  });
  const videoMetaById = new Map<string, ReviewableVideoMeta>(
    videoRows.map((v) => [v.id, v]),
  );

  const reviews = await prisma.videoReview.findMany({
    where: { userId, videoId: { in: videoIds } },
    select: {
      id: true,
      videoId: true,
      rating: true,
      body: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  const reviewByVideo = new Map(reviews.map((r) => [r.videoId, r]));

  return [...byVideo.values()]
    .map((row) => {
      const video = resolveReviewableVideoMeta(row.videoId, videoMetaById);
      if (!video) return null;
      const review = reviewByVideo.get(row.videoId);
      return {
        videoId: row.videoId,
        purchasedAt: row.acquiredAt.toISOString(),
        price: row.price,
        video,
        review: review
          ? {
              id: review.id,
              rating: review.rating,
              body: review.body,
              createdAt: review.createdAt.toISOString(),
              updatedAt: review.updatedAt.toISOString(),
            }
          : null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt));
}

export type SellerReviewSort = "latest" | "oldest" | "low_rating" | "high_rating";

export async function listSellerReviews(
  sellerId: string,
  opts: {
    videoId?: string;
    sort?: SellerReviewSort;
  } = {},
) {
  const videos = await prisma.video.findMany({
    where: { sellerId },
    select: { id: true, title: true, poster: true },
  });
  const videoIds = videos.map((v) => v.id);
  if (videoIds.length === 0) {
    return { videos, reviews: [] as Array<PublicReviewRow & { videoTitle: string; videoPoster: string }> };
  }

  const filterVideoIds = opts.videoId ? [opts.videoId] : videoIds;

  const orderBy =
    opts.sort === "oldest"
      ? [{ createdAt: "asc" as const }]
      : opts.sort === "low_rating"
        ? [{ rating: "asc" as const }, { createdAt: "desc" as const }]
        : opts.sort === "high_rating"
          ? [{ rating: "desc" as const }, { createdAt: "desc" as const }]
          : [{ createdAt: "desc" as const }];

  const rows = await prisma.videoReview.findMany({
    where: {
      videoId: { in: filterVideoIds },
    },
    orderBy,
    take: 200,
  });

  const videoMeta = new Map(videos.map((v) => [v.id, v]));
  const authors = await attachAuthors(rows);

  return {
    videos,
    reviews: rows.map((r) => {
      const v = videoMeta.get(r.videoId);
      const author =
        authors.get(r.userId) ??
        buildReviewAuthorProfile(r.userId, r.nickname, null);
      return {
        ...mapReview(r, author),
        videoTitle: v?.title ?? "",
        videoPoster: v?.poster ?? "",
      };
    }),
  };
}

export async function upsertSellerReply(params: {
  reviewId: string;
  sellerId: string;
  body: string;
}): Promise<PublicReviewRow | null> {
  const review = await prisma.videoReview.findUnique({
    where: { id: params.reviewId },
    include: { video: { select: { sellerId: true } } },
  });
  if (!review || review.video.sellerId !== params.sellerId) return null;

  const now = new Date();
  const row = await prisma.videoReview.update({
    where: { id: params.reviewId },
    data: {
      sellerReply: params.body,
      sellerReplyAt: review.sellerReplyAt ?? now,
      sellerReplyUpdatedAt: now,
    },
  });
  const authors = await attachAuthors([row]);
  return mapReview(
    row,
    authors.get(row.userId) ??
      buildReviewAuthorProfile(row.userId, row.nickname, null),
  );
}

export async function reportReview(params: {
  reviewId: string;
  reporterId: string;
  reason: string;
}): Promise<boolean> {
  const review = await prisma.videoReview.findUnique({
    where: { id: params.reviewId },
    select: { id: true },
  });
  if (!review) return false;

  await prisma.$transaction([
    prisma.videoReview.update({
      where: { id: params.reviewId },
      data: {
        isReported: true,
        reportedAt: new Date(),
        reportedBy: params.reporterId,
      },
    }),
    prisma.report.create({
      data: {
        reporterId: params.reporterId,
        targetType: "video_review",
        targetId: params.reviewId,
        reason: params.reason.slice(0, 500),
        status: "open",
      },
    }),
  ]);

  return true;
}
