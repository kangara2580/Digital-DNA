import { prisma } from "@/lib/prisma";

let schemaEnsurePromise: Promise<void> | null = null;
let schemaEnsureDone = false;

/**
 * videos 테이블에 판매/마이페이지 API에 필요한 컬럼을 런타임에 보정합니다.
 * (배포 DB에 migrate가 아직 없을 때 Prisma 쿼리 500 → 목록/업로드 실패 방지)
 *
 * 성공 시에만 메모이제이션; 실패 시 다음 요청에서 재시도합니다.
 */
export function ensureVideoCategoryColumn(): Promise<void> {
  if (schemaEnsureDone) return Promise.resolve();
  if (schemaEnsurePromise) return schemaEnsurePromise;

  schemaEnsurePromise = (async () => {
    const dbUrl = process.env.DATABASE_URL?.trim() ?? "";
    const isSqlite = dbUrl.startsWith("file:");

    if (isSqlite) {
      const cols = (await prisma.$queryRawUnsafe(
        'PRAGMA table_info("videos")',
      )) as Array<{ name?: string }>;
      const names = new Set(
        cols.map((c) => c.name).filter((n): n is string => Boolean(n)),
      );
      if (!names.has("category")) {
        await prisma.$executeRawUnsafe('ALTER TABLE "videos" ADD COLUMN "category" TEXT');
        names.add("category");
      }
      if (!names.has("processed_video_url")) {
        await prisma.$executeRawUnsafe(
          'ALTER TABLE "videos" ADD COLUMN "processed_video_url" TEXT',
        );
        names.add("processed_video_url");
      }
      if (!names.has("processed_video_error")) {
        await prisma.$executeRawUnsafe(
          'ALTER TABLE "videos" ADD COLUMN "processed_video_error" TEXT',
        );
        names.add("processed_video_error");
      }
      if (!names.has("processed_video_status")) {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "videos" ADD COLUMN "processed_video_status" TEXT NOT NULL DEFAULT 'pending'`,
        );
      }
      schemaEnsureDone = true;
      return;
    }

    const catCols = (await prisma.$queryRawUnsafe(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'videos' AND column_name = 'category' LIMIT 1",
    )) as Array<{ column_name?: string }>;
    if (catCols.length === 0) {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "public"."videos" ADD COLUMN IF NOT EXISTS "category" TEXT',
      );
    }
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "public"."videos" ADD COLUMN IF NOT EXISTS "processed_video_url" TEXT',
    );
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "public"."videos" ADD COLUMN IF NOT EXISTS "processed_video_error" TEXT',
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "public"."videos" ADD COLUMN IF NOT EXISTS "processed_video_status" TEXT NOT NULL DEFAULT 'pending'`,
    );
    await prisma.$executeRawUnsafe(
      `UPDATE "public"."videos" SET "processed_video_status" = 'pending' WHERE "processed_video_status" IS NULL`,
    );

    schemaEnsureDone = true;
  })()
    .catch((err) => {
      console.error("[ensureVideoCategoryColumn]", err);
      throw err;
    })
    .finally(() => {
      schemaEnsurePromise = null;
    });

  return schemaEnsurePromise;
}
