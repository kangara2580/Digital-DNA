import { prisma } from "@/lib/prisma";

export type NoticeRecord = {
  id: string;
  title: string;
  body: string;
  imageUrls: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string | null;
  authorName: string | null;
};

type RawNoticeRow = {
  id: string;
  title: string;
  body: string;
  image_urls: string | null;
  pinned: boolean | number;
  created_at: Date | string;
  updated_at: Date | string;
  author_id: string | null;
  author_name: string | null;
};

let ensured = false;

function isSqlite(): boolean {
  const url = (process.env.DATABASE_URL ?? "").trim();
  return url.startsWith("file:");
}

function toIso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function normalize(row: RawNoticeRow): NoticeRecord {
  let imageUrls: string[] = [];
  if (row.image_urls) {
    try {
      const parsed = JSON.parse(row.image_urls) as unknown;
      if (Array.isArray(parsed)) {
        imageUrls = parsed.filter((v): v is string => typeof v === "string");
      }
    } catch {
      imageUrls = [];
    }
  }
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    imageUrls,
    pinned: row.pinned === true || row.pinned === 1,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    authorId: row.author_id ?? null,
    authorName: row.author_name ?? null,
  };
}

export async function ensureNoticesTable(): Promise<void> {
  if (ensured) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS notices (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      image_urls TEXT NULL,
      pinned BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      author_id TEXT NULL,
      author_name TEXT NULL
    )
  `);
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE notices ADD COLUMN image_urls TEXT NULL
    `);
  } catch {
    // already exists
  }
  ensured = true;
}

export async function listNotices(): Promise<NoticeRecord[]> {
  try {
    await ensureNoticesTable();
    const rows = (await prisma.$queryRawUnsafe(`
      SELECT id, title, body, image_urls, pinned, created_at, updated_at, author_id, author_name
      FROM notices
      ORDER BY pinned DESC, created_at DESC
    `)) as RawNoticeRow[];
    return rows.map(normalize);
  } catch (error) {
    console.error("[listNotices] failed", error);
    return [];
  }
}

export async function getNoticeById(id: string): Promise<NoticeRecord | null> {
  try {
    await ensureNoticesTable();
    const rows = (await prisma.$queryRawUnsafe(
      `
        SELECT id, title, body, image_urls, pinned, created_at, updated_at, author_id, author_name
        FROM notices
        WHERE id = ${isSqlite() ? "?" : "$1"}
        LIMIT 1
      `,
      id,
    )) as RawNoticeRow[];
    return rows[0] ? normalize(rows[0]) : null;
  } catch (error) {
    console.error("[getNoticeById] failed", error);
    return null;
  }
}

export async function createNotice(input: {
  id: string;
  title: string;
  body: string;
  imageUrls?: string[];
  pinned: boolean;
  authorId?: string | null;
  authorName?: string | null;
}): Promise<void> {
  await ensureNoticesTable();
  const pinValue = input.pinned ? 1 : 0;
  if (isSqlite()) {
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO notices (id, title, body, image_urls, pinned, author_id, author_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      input.id,
      input.title,
      input.body,
      JSON.stringify(input.imageUrls ?? []),
      pinValue,
      input.authorId ?? null,
      input.authorName ?? null,
    );
    return;
  }

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO notices (id, title, body, image_urls, pinned, author_id, author_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    input.id,
    input.title,
    input.body,
    JSON.stringify(input.imageUrls ?? []),
    input.pinned,
    input.authorId ?? null,
    input.authorName ?? null,
  );
}
