import type { AdminUser } from "@/lib/adminAuth";
import {
  getAllCatalogVideosForSync,
  getExternalKey,
  getExternalProvider,
} from "@/lib/catalogVideos";
import { writeContentChangeLog } from "@/lib/contentChangeLog";
import { prisma } from "@/lib/prisma";

export type CatalogSyncResult = {
  created: number;
  updated: number;
  total: number;
};

export async function syncAllCatalogVideosToDb(actor: AdminUser): Promise<CatalogSyncResult> {
  const videos = getAllCatalogVideosForSync();
  let created = 0;
  let updated = 0;

  for (const video of videos) {
    const existing = await prisma.video.findUnique({
      where: { id: video.id },
      select: { id: true },
    });
    const externalProvider = getExternalProvider(video);
    const externalKey = getExternalKey(video);

    await prisma.video.upsert({
      where: { id: video.id },
      create: {
        id: video.id,
        title: video.title,
        creator: video.creator,
        src: video.src,
        poster: video.poster,
        orientation: video.orientation,
        durationSec: video.durationSec,
        price: video.priceWon ?? 0,
        views: video.listing?.views ?? 0,
        salesCount: video.listing?.salesCount ?? 0,
        editionKind: "open",
        sellerId: video.listing?.sellerId ?? `catalog:${video.creator.slice(0, 32)}`,
        description: video.description,
        hashtags: video.hashtags,
        isAiGenerated: video.isAiGenerated ?? false,
        category: video.category ?? video.listing?.category ?? video.catalogSource,
        sourcePageUrl: video.sourcePageUrl,
        externalProvider,
        externalKey,
        status: "approved",
        approvedAt: new Date(),
        approvedBy: actor.id,
      },
      update: {
        title: video.title,
        creator: video.creator,
        src: video.src,
        poster: video.poster,
        orientation: video.orientation,
        durationSec: video.durationSec,
        price: video.priceWon ?? 0,
        views: video.listing?.views ?? 0,
        salesCount: video.listing?.salesCount ?? 0,
        description: video.description,
        hashtags: video.hashtags,
        isAiGenerated: video.isAiGenerated ?? false,
        category: video.category ?? video.listing?.category ?? video.catalogSource,
        sourcePageUrl: video.sourcePageUrl,
        externalProvider,
        externalKey,
      },
    });

    if (existing) updated += 1;
    else created += 1;
  }

  const result = { created, updated, total: videos.length };

  await prisma.adminAuditLog.create({
    data: {
      actorId: actor.id,
      actorEmail: actor.email,
      action: "catalog.sync",
      targetType: "video_catalog",
      targetId: "all_existing_site_videos",
      afterJson: result,
    },
  });
  await writeContentChangeLog({
    targetType: "video_catalog",
    targetId: "all_existing_site_videos",
    actorId: actor.id,
    actorType: "admin",
    changeType: "sync",
    after: result,
  });

  return result;
}
