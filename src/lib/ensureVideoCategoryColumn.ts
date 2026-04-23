import { prisma } from "@/lib/prisma";

let ensuredPromise: Promise<void> | null = null;

/**
 * 실행 환경 DB가 서로 달라도(로컬/서버) 카테고리 저장 시 런타임 오류가 나지 않도록
 * videos.category 컬럼을 안전하게 보정합니다.
 */
export function ensureVideoCategoryColumn(): Promise<void> {
  if (ensuredPromise) return ensuredPromise;

  ensuredPromise = (async () => {
    const dbUrl = process.env.DATABASE_URL?.trim() ?? "";
    const isSqlite = dbUrl.startsWith("file:");
    if (isSqlite) {
      const cols = (await prisma.$queryRawUnsafe(
        'PRAGMA table_info("videos")',
      )) as Array<{ name?: string }>;
      const hasCategory = cols.some((c) => c?.name === "category");
      if (!hasCategory) {
        // SQLite는 버전에 따라 IF NOT EXISTS가 불가할 수 있어 분기 처리합니다.
        await prisma.$executeRawUnsafe('ALTER TABLE "videos" ADD COLUMN "category" TEXT');
      }
      return;
    }

    const cols = (await prisma.$queryRawUnsafe(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'videos' AND column_name = 'category' LIMIT 1",
    )) as Array<{ column_name?: string }>;
    if (cols.length === 0) {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "public"."videos" ADD COLUMN IF NOT EXISTS "category" TEXT',
      );
    }
  })();

  return ensuredPromise;
}
