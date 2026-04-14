import path from "path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const DEFAULT_SQLITE_FILE = path.join(process.cwd(), "prisma", "dev.db");

/**
 * SQLite `file:./dev.db` 는 실행 cwd에 따라 엉뚱한 경로로 열리며 "Unable to open database file" → API 500.
 * 스키마(.env.example) 기준 실제 파일은 항상 프로젝트의 prisma/dev.db 로 고정한다.
 *
 * DATABASE_URL 미설정 시(로컬에서 .env 누락 등)에도 동일 경로로 연결해 Prisma 초기화 실패를 막는다.
 */
function resolveDatabaseUrl(): string {
  const u = process.env.DATABASE_URL?.trim();
  if (!u) return `file:${DEFAULT_SQLITE_FILE}`;
  if (!u.startsWith("file:")) return u;
  const body = u.slice("file:".length);
  if (path.isAbsolute(body)) return u;
  const normalized = body.replace(/^\.\//, "");
  if (normalized === "dev.db") {
    return `file:${DEFAULT_SQLITE_FILE}`;
  }
  return `file:${path.resolve(process.cwd(), normalized)}`;
}

const dbUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: dbUrl } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
