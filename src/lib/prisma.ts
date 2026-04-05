import path from "path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * SQLite `file:./dev.db` 는 실행 cwd에 따라 엉뚱한 경로로 열리며 "Unable to open database file" → API 500.
 * 스키마(.env.example) 기준 실제 파일은 항상 프로젝트의 prisma/dev.db 로 고정한다.
 */
function resolveDatabaseUrl(): string | undefined {
  const u = process.env.DATABASE_URL?.trim();
  if (!u) return undefined;
  if (!u.startsWith("file:")) return u;
  const body = u.slice("file:".length);
  if (path.isAbsolute(body)) return u;
  const normalized = body.replace(/^\.\//, "");
  if (normalized === "dev.db") {
    return `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
  }
  return `file:${path.resolve(process.cwd(), normalized)}`;
}

const dbUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
