import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Prisma is intentionally pinned to Supabase PostgreSQL.
 * Do not silently fall back to SQLite: it hides schema drift and makes local
 * behavior differ from production.
 */
function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is required and must point to Supabase PostgreSQL.");
  }
  if (url.startsWith("file:")) {
    throw new Error("SQLite DATABASE_URL is no longer supported. Use Supabase PostgreSQL.");
  }
  return url;
}

const dbUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: dbUrl } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
