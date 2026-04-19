import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import {
  MultipartParseError,
  parseSellUploadMultipart,
} from "@/lib/parseMultipartSellUpload";
import { getNeutralPosterBuffer, NEUTRAL_POSTER_DATA_URL } from "@/lib/neutralPoster";
import { normalizeSellHashtags } from "@/lib/sellHashtags";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 120;

const ALLOWED_MIME = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
]);

const ALLOWED_POSTER_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function sanitizeFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
  return base || "clip.mp4";
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

async function uploadSellVideoWithOptionalCustomPoster(params: {
  client: SupabaseClient;
  userId: string;
  videoBuffer: Buffer;
  videoMime: string;
  safeFileName: string;
  posterBuffer: Buffer | null;
  posterMime: string | null;
}): Promise<{ videoUrl: string; posterUrl: string } | null> {
  const { client, userId, videoBuffer, videoMime, safeFileName, posterBuffer, posterMime } =
    params;
  const stamp = Date.now();
  const videoPath = `sell/${userId}/${stamp}_${safeFileName}`;

  const { error: vErr } = await client.storage.from("videos").upload(videoPath, videoBuffer, {
    contentType: videoMime,
    upsert: true,
  });
  if (vErr) return null;

  const videoUrl = client.storage.from("videos").getPublicUrl(videoPath).data.publicUrl;

  if (posterBuffer && posterBuffer.length > 0 && posterMime && ALLOWED_POSTER_MIME.has(posterMime)) {
    const ext = posterMime === "image/png" ? "png" : posterMime === "image/webp" ? "webp" : "jpg";
    const thumbPath = `sell/${userId}/${stamp}_poster.${ext}`;
    const { error: tErr } = await client.storage.from("thumbnails").upload(thumbPath, posterBuffer, {
      contentType: posterMime,
      upsert: true,
    });
    if (!tErr) {
      const posterUrl = client.storage.from("thumbnails").getPublicUrl(thumbPath).data.publicUrl;
      return { videoUrl, posterUrl };
    }
  }

  const posterBuf = getNeutralPosterBuffer();

  const thumbPath = `sell/${userId}/${stamp}_poster.jpg`;
  const { error: tErr } = await client.storage.from("thumbnails").upload(thumbPath, posterBuf, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (tErr) {
    return { videoUrl, posterUrl: NEUTRAL_POSTER_DATA_URL };
  }
  const posterUrl = client.storage.from("thumbnails").getPublicUrl(thumbPath).data.publicUrl;
  return { videoUrl, posterUrl };
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

async function uploadSellPosterOnly(
  client: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const posterBuf = getNeutralPosterBuffer();
  const stamp = Date.now();
  const thumbPath = `sell/${userId}/${stamp}_poster.jpg`;
  const { error } = await client.storage.from("thumbnails").upload(thumbPath, posterBuf, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) return null;
  return client.storage.from("thumbnails").getPublicUrl(thumbPath).data.publicUrl;
}

function displayNameFromUser(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): string {
  const meta = user.user_metadata;
  const nick =
    typeof meta?.nickname === "string" && meta.nickname.trim()
      ? meta.nickname.trim()
      : null;
  if (nick) return nick;
  const email = user.email?.split("@")[0];
  return email && email.length > 0 ? email : "seller";
}

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseConfigured = Boolean(url && anonKey);
  let bearerToken: string | null = null;

  let user: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  };
  if (supabaseConfigured) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : null;
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }
    bearerToken = token;

    const supabaseAuth = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user: verifiedUser },
      error: userErr,
    } = await supabaseAuth.auth.getUser(token);
    if (userErr || !verifiedUser) {
      return NextResponse.json(
        { ok: false, error: "세션이 유효하지 않습니다. 다시 로그인해 주세요." },
        { status: 401 },
      );
    }
    user = verifiedUser;
  } else {
    user = {
      id: process.env.NEXT_PUBLIC_DEMO_SELLER_ID ?? "seller-demo",
      email: "demo@local",
      user_metadata: { nickname: "demo_seller" },
    };
  }

  let parsed: Awaited<ReturnType<typeof parseSellUploadMultipart>>;
  try {
    parsed = await parseSellUploadMultipart(request);
  } catch (e) {
    if (e instanceof MultipartParseError) {
      if (e.code === "file_too_large") {
        return NextResponse.json({ ok: false, error: e.message }, { status: 413 });
      }
      return NextResponse.json(
        { ok: false, error: e.message || "요청 본문을 읽을 수 없습니다." },
        { status: 400 },
      );
    }
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: msg || "요청 본문을 읽을 수 없습니다." },
      { status: 400 },
    );
  }

  const { fields, video: videoPart, poster: posterPart } = parsed;

  if (posterPart && posterPart.buffer.length > 0 && !ALLOWED_POSTER_MIME.has(posterPart.mime)) {
    return NextResponse.json(
      { ok: false, error: "썸네일은 JPEG, PNG, WebP만 가능합니다." },
      { status: 400 },
    );
  }
  const customPoster =
    posterPart && posterPart.buffer.length > 0
      ? { buffer: posterPart.buffer, mime: posterPart.mime }
      : null;

  const videoUrlRaw = String(fields.videoUrl ?? "").trim();
  const hasFile = Boolean(videoPart && videoPart.buffer.length > 0);
  const hasVideoUrl = videoUrlRaw.length > 0;
  if (!hasFile && !hasVideoUrl) {
    return NextResponse.json(
      { ok: false, error: "동영상 파일 또는 동영상 URL을 입력해 주세요." },
      { status: 400 },
    );
  }

  if (hasFile && videoPart) {
    const mime = videoPart.mime || "application/octet-stream";
    if (!ALLOWED_MIME.has(mime)) {
      return NextResponse.json(
        {
          ok: false,
          error: "지원하는 형식은 MP4, MOV, WebM, AVI 계열입니다.",
        },
        { status: 400 },
      );
    }
  }

  let normalizedVideoUrl: string | null = null;
  if (hasVideoUrl) {
    if (videoUrlRaw.startsWith("/")) {
      normalizedVideoUrl = videoUrlRaw;
    } else {
      try {
        const u = new URL(videoUrlRaw.startsWith("http") ? videoUrlRaw : `https://${videoUrlRaw}`);
        if (!(u.protocol === "http:" || u.protocol === "https:")) {
          throw new Error("bad protocol");
        }
        normalizedVideoUrl = u.toString();
      } catch {
        return NextResponse.json(
          { ok: false, error: "동영상 URL 형식이 올바르지 않습니다." },
          { status: 400 },
        );
      }
    }
  }

  const title = String(fields.title ?? "").trim();
  if (!title) {
    return NextResponse.json(
      { ok: false, error: "제목을 입력해 주세요." },
      { status: 400 },
    );
  }

  const description = String(fields.description ?? "").trim();
  const hashtagsRaw = String(fields.hashtags ?? "").trim();
  const priceRaw = String(fields.price ?? "").trim();
  const priceWon = Number.parseInt(priceRaw.replace(/,/g, ""), 10);
  if (!Number.isFinite(priceWon) || priceWon < 100) {
    return NextResponse.json(
      { ok: false, error: "가격은 100원 이상으로 입력해 주세요." },
      { status: 400 },
    );
  }

  const orientationRaw = String(fields.orientation ?? "portrait");
  const orientation =
    orientationRaw === "landscape" ? "landscape" : "portrait";

  const isAi =
    String(fields.isAiGenerated ?? "") === "true" ||
    String(fields.isAiGenerated ?? "") === "on";

  const rightsOk = String(fields.rightsConfirmed ?? "") === "true";
  const originalOk = String(fields.confirmOriginal ?? "") === "true";
  if (!rightsOk || !originalOk) {
    return NextResponse.json(
      { ok: false, error: "권리·제3자 권리 확인에 모두 동의해 주세요." },
      { status: 400 },
    );
  }

  const editionKindRaw = String(fields.editionKind ?? "open");
  const editionKind = editionKindRaw === "limited" ? "limited" : "open";
  let editionCap: number | null = null;
  if (editionKind === "limited") {
    const cap = Number.parseInt(String(fields.editionCap ?? ""), 10);
    if (!Number.isFinite(cap) || cap < 1) {
      return NextResponse.json(
        { ok: false, error: "한정 판매일 때는 판매 가능 수량(1 이상)을 입력해 주세요." },
        { status: 400 },
      );
    }
    editionCap = cap;
  }

  const durationSecRaw = String(fields.durationSec ?? "").trim();
  const durationParsed = Number.parseFloat(durationSecRaw);
  const durationSec =
    Number.isFinite(durationParsed) && durationParsed > 0
      ? Math.round(durationParsed)
      : null;

  let publicSrc = normalizedVideoUrl ?? "";
  let posterForDb = NEUTRAL_POSTER_DATA_URL;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
  const canTrySupabaseStorage =
    Boolean(url && anonKey && supabaseConfigured) &&
    Boolean(serviceRoleKey || bearerToken);

  if (hasFile && videoPart) {
    const buffer = videoPart.buffer;
    const mime = videoPart.mime || "application/octet-stream";
    const safe = sanitizeFilename(videoPart.filename || "clip.mp4");
    let usedStorage = false;

    if (canTrySupabaseStorage) {
      try {
        const storageClient = createStorageClient(url!, anonKey!, {
          serviceRoleKey,
          userJwt: serviceRoleKey ? null : bearerToken,
        });
        const uploaded = await uploadSellVideoWithOptionalCustomPoster({
          client: storageClient,
          userId: user.id,
          videoBuffer: buffer,
          videoMime: mime,
          safeFileName: safe,
          posterBuffer: customPoster?.buffer ?? null,
          posterMime: customPoster?.mime ?? null,
        });
        if (uploaded) {
          publicSrc = uploaded.videoUrl;
          posterForDb = uploaded.posterUrl;
          usedStorage = true;
        }
      } catch {
        /* 로컬 폴백 */
      }
    }

    if (!usedStorage) {
      const relDir = path.posix.join("uploads", "sell", user.id);
      const diskDir = path.join(process.cwd(), "public", relDir);
      await mkdir(diskDir, { recursive: true });
      const stamp = Date.now();
      const fileName = `${stamp}_${safe}`;
      const diskPath = path.join(diskDir, fileName);
      await writeFile(diskPath, buffer);
      publicSrc = `/${relDir.replace(/\\/g, "/")}/${fileName}`;
      if (customPoster) {
        const ext =
          customPoster.mime === "image/png"
            ? "png"
            : customPoster.mime === "image/webp"
              ? "webp"
              : "jpg";
        const posterName = `${stamp}_poster.${ext}`;
        await writeFile(path.join(diskDir, posterName), customPoster.buffer);
        posterForDb = `/${relDir.replace(/\\/g, "/")}/${posterName}`;
      } else {
        posterForDb = NEUTRAL_POSTER_DATA_URL;
      }
    }
  } else if (hasVideoUrl && canTrySupabaseStorage) {
    try {
      const storageClient = createStorageClient(url!, anonKey!, {
        serviceRoleKey,
        userJwt: serviceRoleKey ? null : bearerToken,
      });
      if (customPoster) {
        const thumb = await uploadCustomPosterBuffer(
          storageClient,
          user.id,
          customPoster.buffer,
          customPoster.mime,
        );
        if (thumb) posterForDb = thumb;
      } else {
        const thumb = await uploadSellPosterOnly(storageClient, user.id);
        if (thumb) posterForDb = thumb;
      }
    } catch {
      /* 기본 포스터 유지 */
    }
  }

  const hashtagsNormalized = normalizeSellHashtags(hashtagsRaw);

  const creator = displayNameFromUser(user);

  const created = await prisma.video.create({
    data: {
      title,
      creator,
      src: publicSrc,
      poster: posterForDb,
      orientation,
      durationSec: durationSec,
      price: priceWon,
      sellerId: user.id,
      editionKind,
      editionCap,
      description: description || null,
      hashtags: hashtagsNormalized,
      isAiGenerated: isAi,
    },
  });

  return NextResponse.json({
    ok: true,
    videoId: created.id,
    message:
      "등록이 접수되었습니다. 심사 후 마켓에 노출될 수 있어요(데모: 즉시 DB 반영).",
  });
}
