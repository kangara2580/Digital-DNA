import { prisma } from "@/lib/prisma";

let ensuredPromise: Promise<void> | null = null;

/**
 * 판매 피드 소개글 저장용 `profiles.seller_bio` 컬럼을 런타임에서 안전 보정합니다.
 */
export function ensureProfileSellerBioColumn(): Promise<void> {
  if (ensuredPromise) return ensuredPromise;

  ensuredPromise = (async () => {
    const dbUrl = process.env.DATABASE_URL?.trim() ?? "";
    const isSqlite = dbUrl.startsWith("file:");
    if (isSqlite) {
      const cols = (await prisma.$queryRawUnsafe(
        'PRAGMA table_info("profiles")',
      )) as Array<{ name?: string }>;
      const hasSellerBio = cols.some((c) => c?.name === "seller_bio");
      if (!hasSellerBio) {
        await prisma.$executeRawUnsafe('ALTER TABLE "profiles" ADD COLUMN "seller_bio" TEXT');
      }
      return;
    }

    const cols = (await prisma.$queryRawUnsafe(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'seller_bio' LIMIT 1",
    )) as Array<{ column_name?: string }>;
    if (cols.length === 0) {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "seller_bio" TEXT',
      );
    }
  })();

  return ensuredPromise;
}
