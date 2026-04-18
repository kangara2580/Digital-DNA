import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { videoRowToFeedVideo } from "@/lib/flashSaleVideos";
import { prisma } from "@/lib/prisma";
import { normalizeSellHashtags } from "@/lib/sellHashtags";

export const runtime = "nodejs";

const ALLOWED_POSTER_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

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
  if (error) return null;
  return client.storage.from("thumbnails").getPublicUrl(thumbPath).data.publicUrl;
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
      return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 401 });
    }
    userId = user.id;
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

  const existing = await prisma.video.findFirst({
    where: { id, sellerId: userId },
  });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  let posterUrl: string | undefined;

  if (poster instanceof Blob && poster.size > 0) {
    const mime = poster.type || "image/jpeg";
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

    if (canTrySupabaseStorage) {
      try {
        const storageClient = createStorageClient(url!, anonKey!, {
          serviceRoleKey,
          userJwt: serviceRoleKey ? null : bearerToken,
        });
        const uploaded = await uploadCustomPosterBuffer(storageClient, userId, buf, mime);
        if (uploaded) posterUrl = uploaded;
      } catch {
        return NextResponse.json({ ok: false, error: "poster_upload_failed" }, { status: 500 });
      }
    } else {
      const relDir = path.posix.join("uploads", "sell", userId);
      const diskDir = path.join(process.cwd(), "public", relDir);
      await mkdir(diskDir, { recursive: true });
      const stamp = Date.now();
      const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
      const posterName = `${stamp}_poster.${ext}`;
      await writeFile(path.join(diskDir, posterName), buf);
      posterUrl = `/${relDir.replace(/\\/g, "/")}/${posterName}`;
    }
  }

  try {
    const updated = await prisma.video.update({
      where: { id },
      data: {
        title,
        description: description || null,
        hashtags: hashtagsNormalized,
        ...(posterUrl ? { poster: posterUrl } : {}),
      },
    });
    return NextResponse.json({
      ok: true,
      video: videoRowToFeedVideo(updated),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}
