import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { decodeDevUserIdFromJwt } from "@/lib/devJwtFallback";
import { ensureVideoCategoryColumn } from "@/lib/ensureVideoCategoryColumn";
import { videoRowToFeedVideo } from "@/lib/flashSaleVideos";
import { prisma } from "@/lib/prisma";
import { isSellVideoCategory } from "@/lib/sellVideoCategory";
import { normalizeSellHashtags } from "@/lib/sellHashtags";

export const runtime = "nodejs";

const ALLOWED_POSTER_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/** multipart에서 종종 `application/octet-stream` 또는 빈 type으로 옴 — File 이름·관용으로 보정 */
function normalizePosterMime(poster: Blob): string {
  const raw = poster.type?.trim().toLowerCase() ?? "";
  if (raw === "image/jpg") return "image/jpeg";
  if (ALLOWED_POSTER_MIME.has(raw)) return raw;
  if (raw === "application/octet-stream" || raw === "") {
    const name =
      typeof (poster as File).name === "string"
        ? (poster as File).name.toLowerCase()
        : "";
    if (name.endsWith(".png")) return "image/png";
    if (name.endsWith(".webp")) return "image/webp";
    if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
    return "image/jpeg";
  }
  return raw;
}

function isPersistentStorageRequired(): boolean {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

function hasUnknownCategoryArgError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.includes("Unknown argument `category`");
}

function createStorageClient(
  supabaseUrl: string,
  anonKey: string,
  opts: { serviceRoleKey?: string | null; userJwt?: string | null },
): SupabaseClient {
  const srk = opts.serviceRoleKey?.trim();
  if (srk) {
    return createClient(supabaseUrl, srk, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  const jwt = opts.userJwt?.trim();
  if (!jwt) {
    throw new Error("storage_auth_missing");
  }
  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}

async function uploadCustomPosterBuffer(
  client: SupabaseClient,
  userId: string,
  buffer: Buffer,
  mime: string,
): Promise<string | null> {
  if (!ALLOWED_POSTER_MIME.has(mime)) return null;
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const stamp = Date.now();
  const thumbPath = `sell/${userId}/${stamp}_poster.${ext}`;
  const { error } = await client.storage.from("thumbnails").upload(thumbPath, buffer, {
    contentType: mime,
    upsert: true,
  });
  if (error) {
    console.warn("[PATCH sell/video] thumbnails upload failed:", error.message);
    return null;
  }
  return client.storage.from("thumbnails").getPublicUrl(thumbPath).data.publicUrl;
}

/**
 * GET /api/sell/video/[id]
 * Authorization: Bearer — 본인이 등록한 영상만 조회(수정 페이지용)
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseConfigured = Boolean(url && anonKey);

  let userId: string;

  if (supabaseConfigured) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : null;
    if (!token) {
      return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
    }
    const supabaseAuth = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: userErr,
    } = await supabaseAuth.auth.getUser(token);
    if (userErr || !user) {
      const fallbackUserId = decodeDevUserIdFromJwt(token);
      if (!fallbackUserId) {
        return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 401 });
      }
      userId = fallbackUserId;
    } else {
      userId = user.id;
    }
  } else {
    userId = process.env.NEXT_PUBLIC_DEMO_SELLER_ID ?? "seller-demo";
  }

  let row;
  try {
    await ensureVideoCategoryColumn();
    row = await prisma.video.findFirst({
      where: { id, sellerId: userId },
    });
  } catch (e) {
    console.error("[GET /api/sell/video/:id] db_read_failed", e);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, video: videoRowToFeedVideo(row) });
}

/**
 * PATCH /api/sell/video/[id]
 * multipart/form-data: title, description, hashtags, optional poster (File)
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseConfigured = Boolean(url && anonKey);

  let bearerToken: string | null = null;
  let userId: string;

  if (supabaseConfigured) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : null;
    if (!token) {
      return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
    }
    bearerToken = token;
    const supabaseAuth = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: userErr,
    } = await supabaseAuth.auth.getUser(token);
    if (userErr || !user) {
      const fallbackUserId = decodeDevUserIdFromJwt(token);
      if (!fallbackUserId) {
        return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 401 });
      }
      userId = fallbackUserId;
    } else {
      userId = user.id;
    }
  } else {
    userId = process.env.NEXT_PUBLIC_DEMO_SELLER_ID ?? "seller-demo";
  }

  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_body" }, { status: 400 });
  }

  const titleRaw = fd.get("title");
  const descriptionRaw = fd.get("description");
  const hashtagsRaw = fd.get("hashtags");
  const categoryRaw = fd.get("category");
  const poster = fd.get("poster");

  const title =
    typeof titleRaw === "string" ? titleRaw.trim() : String(titleRaw ?? "").trim();
  if (!title) {
    return NextResponse.json({ ok: false, error: "제목을 입력해 주세요." }, { status: 400 });
  }

  const description =
    typeof descriptionRaw === "string" ? descriptionRaw.trim() : String(descriptionRaw ?? "").trim();
  const hashtagsNormalized = normalizeSellHashtags(
    typeof hashtagsRaw === "string" ? hashtagsRaw : String(hashtagsRaw ?? ""),
  );
  const category =
    typeof categoryRaw === "string"
      ? categoryRaw.trim()
      : String(categoryRaw ?? "").trim();
  if (!isSellVideoCategory(category)) {
    return NextResponse.json(
      { ok: false, error: "카테고리를 선택해 주세요." },
      { status: 400 },
    );
  }

  let existing;
  try {
    await ensureVideoCategoryColumn();
    existing = await prisma.video.findFirst({
      where: { id, sellerId: userId },
    });
  } catch (e) {
    console.error("[PATCH /api/sell/video/:id] db_precheck_failed", e);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  let posterUrl: string | undefined;

  if (poster instanceof Blob && poster.size > 0) {
    const mime = normalizePosterMime(poster);
    if (!ALLOWED_POSTER_MIME.has(mime)) {
      return NextResponse.json(
        { ok: false, error: "썸네일은 JPEG, PNG, WebP만 가능합니다." },
        { status: 400 },
      );
    }
    if (poster.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "썸네일은 8MB 이하로 올려 주세요." },
        { status: 413 },
      );
    }
    const buf = Buffer.from(await poster.arrayBuffer());

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
    const canTrySupabaseStorage =
      Boolean(url && anonKey && supabaseConfigured) &&
      Boolean(serviceRoleKey || bearerToken);
    const requirePersistentStorage = isPersistentStorageRequired();

    if (canTrySupabaseStorage) {
      try {
        const storageClient = createStorageClient(url!, anonKey!, {
          serviceRoleKey,
          userJwt: serviceRoleKey ? null : bearerToken,
        });
        const uploaded = await uploadCustomPosterBuffer(storageClient, userId, buf, mime);
        if (uploaded) {
          posterUrl = uploaded;
        }
      } catch {
        /* 스토리지 오류 시 아래 public 디스크로 폴백 */
      }
    }

    if (!posterUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: requirePersistentStorage
            ? "썸네일 저장소 업로드에 실패했습니다. Supabase Storage(thumbnails) 설정을 확인해 주세요."
            : "개발 환경에서도 썸네일 저장소 업로드에 실패했습니다.",
        },
        { status: requirePersistentStorage ? 503 : 500 },
      );
    }
  }

  try {
    let updated;
    try {
      updated = await prisma.video.update({
        where: { id },
        data: {
          title,
          description: description || null,
          hashtags: hashtagsNormalized,
          category,
          ...(posterUrl ? { poster: posterUrl } : {}),
        },
      });
    } catch (e) {
      if (!hasUnknownCategoryArgError(e)) throw e;
      // 구 Prisma Client가 category 필드를 모를 때도 저장은 계속되게 폴백합니다.
      updated = await prisma.video.update({
        where: { id },
        data: {
          title,
          description: description || null,
          hashtags: hashtagsNormalized,
          ...(posterUrl ? { poster: posterUrl } : {}),
        },
      });
      const dbUrl = process.env.DATABASE_URL?.trim() ?? "";
      if (dbUrl.startsWith("file:")) {
        await prisma.$executeRawUnsafe(
          'UPDATE "videos" SET "category" = ? WHERE "id" = ?',
          category,
          id,
        );
      } else {
        await prisma.$executeRawUnsafe(
          'UPDATE "public"."videos" SET "category" = $1 WHERE "id" = $2',
          category,
          id,
        );
      }
    }
    return NextResponse.json({
      ok: true,
      video: videoRowToFeedVideo(updated),
    });
  } catch (e) {
    console.error("[PATCH /api/sell/video/:id] db_update_failed", e);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}

async function resolveSellerUserId(request: Request): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseConfigured = Boolean(url && anonKey);

  if (supabaseConfigured) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : null;
    if (!token) {
      return {
        ok: false,
        response: NextResponse.json({ ok: false, error: "login_required" }, { status: 401 }),
      };
    }
    const supabaseAuth = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: userErr,
    } = await supabaseAuth.auth.getUser(token);
    if (userErr || !user) {
      const fallbackUserId = decodeDevUserIdFromJwt(token);
      if (!fallbackUserId) {
        return {
          ok: false,
          response: NextResponse.json({ ok: false, error: "invalid_session" }, { status: 401 }),
        };
      }
      return { ok: true, userId: fallbackUserId };
    }
    return { ok: true, userId: user.id };
  }
  return { ok: true, userId: process.env.NEXT_PUBLIC_DEMO_SELLER_ID ?? "seller-demo" };
}

/**
 * DELETE /api/sell/video/[id]
 * Authorization: Bearer — 본인이 등록한 영상만 삭제 (연관 알림은 DB cascade)
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const auth = await resolveSellerUserId(request);
  if (!auth.ok) return auth.response;

  try {
    const result = await prisma.video.deleteMany({
      where: { id, sellerId: auth.userId },
    });
    if (result.count === 0) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}
