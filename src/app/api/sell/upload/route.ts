import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 120;

const ALLOWED_MIME = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
]);

const DEFAULT_POSTER =
  "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=640";

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

async function fetchDefaultPosterBuffer(): Promise<Buffer | null> {
  try {
    const res = await fetch(DEFAULT_POSTER);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function uploadSellVideoAndPoster(params: {
  client: SupabaseClient;
  userId: string;
  videoBuffer: Buffer;
  videoMime: string;
  safeFileName: string;
}): Promise<{ videoUrl: string; posterUrl: string } | null> {
  const { client, userId, videoBuffer, videoMime, safeFileName } = params;
  const stamp = Date.now();
  const videoPath = `sell/${userId}/${stamp}_${safeFileName}`;

  const { error: vErr } = await client.storage.from("videos").upload(videoPath, videoBuffer, {
    contentType: videoMime,
    upsert: true,
  });
  if (vErr) return null;

  const videoUrl = client.storage.from("videos").getPublicUrl(videoPath).data.publicUrl;

  const posterBuf = await fetchDefaultPosterBuffer();
  if (!posterBuf) {
    return { videoUrl, posterUrl: DEFAULT_POSTER };
  }

  const thumbPath = `sell/${userId}/${stamp}_poster.jpg`;
  const { error: tErr } = await client.storage.from("thumbnails").upload(thumbPath, posterBuf, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (tErr) {
    return { videoUrl, posterUrl: DEFAULT_POSTER };
  }
  const posterUrl = client.storage.from("thumbnails").getPublicUrl(thumbPath).data.publicUrl;
  return { videoUrl, posterUrl };
}

async function uploadSellPosterOnly(
  client: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const posterBuf = await fetchDefaultPosterBuffer();
  if (!posterBuf) return null;
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

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "요청 본문을 읽을 수 없습니다." },
      { status: 400 },
    );
  }

  const file = form.get("video");
  const videoUrlRaw = String(form.get("videoUrl") ?? "").trim();
  const hasFile = file instanceof File && file.size > 0;
  const hasVideoUrl = videoUrlRaw.length > 0;
  if (!hasFile && !hasVideoUrl) {
    return NextResponse.json(
      { ok: false, error: "동영상 파일 또는 동영상 URL을 입력해 주세요." },
      { status: 400 },
    );
  }

  if (hasFile) {
    const mime = (file as File).type || "application/octet-stream";
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

  const title = String(form.get("title") ?? "").trim();
  if (!title) {
    return NextResponse.json(
      { ok: false, error: "제목을 입력해 주세요." },
      { status: 400 },
    );
  }

  const description = String(form.get("description") ?? "").trim();
  const hashtagsRaw = String(form.get("hashtags") ?? "").trim();
  const priceRaw = String(form.get("price") ?? "").trim();
  const priceWon = Number.parseInt(priceRaw.replace(/,/g, ""), 10);
  if (!Number.isFinite(priceWon) || priceWon < 100) {
    return NextResponse.json(
      { ok: false, error: "가격은 100원 이상으로 입력해 주세요." },
      { status: 400 },
    );
  }

  const orientationRaw = String(form.get("orientation") ?? "portrait");
  const orientation =
    orientationRaw === "landscape" ? "landscape" : "portrait";

  const isAi =
    String(form.get("isAiGenerated") ?? "") === "true" ||
    String(form.get("isAiGenerated") ?? "") === "on";

  const rightsOk = String(form.get("rightsConfirmed") ?? "") === "true";
  const originalOk = String(form.get("confirmOriginal") ?? "") === "true";
  if (!rightsOk || !originalOk) {
    return NextResponse.json(
      { ok: false, error: "권리·제3자 권리 확인에 모두 동의해 주세요." },
      { status: 400 },
    );
  }

  const editionKindRaw = String(form.get("editionKind") ?? "open");
  const editionKind = editionKindRaw === "limited" ? "limited" : "open";
  let editionCap: number | null = null;
  if (editionKind === "limited") {
    const cap = Number.parseInt(String(form.get("editionCap") ?? ""), 10);
    if (!Number.isFinite(cap) || cap < 1) {
      return NextResponse.json(
        { ok: false, error: "한정 판매일 때는 판매 가능 수량(1 이상)을 입력해 주세요." },
        { status: 400 },
      );
    }
    editionCap = cap;
  }

  const durationSecRaw = String(form.get("durationSec") ?? "").trim();
  const durationParsed = Number.parseFloat(durationSecRaw);
  const durationSec =
    Number.isFinite(durationParsed) && durationParsed > 0
      ? Math.round(durationParsed)
      : null;

  let publicSrc = normalizedVideoUrl ?? "";
  let posterForDb = DEFAULT_POSTER;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
  const canTrySupabaseStorage =
    Boolean(url && anonKey && supabaseConfigured) &&
    Boolean(serviceRoleKey || bearerToken);

  if (hasFile) {
    const buffer = Buffer.from(await (file as File).arrayBuffer());
    const mime = (file as File).type || "application/octet-stream";
    const safe = sanitizeFilename((file as File).name || "clip.mp4");
    let usedStorage = false;

    if (canTrySupabaseStorage) {
      try {
        const storageClient = createStorageClient(url!, anonKey!, {
          serviceRoleKey,
          userJwt: serviceRoleKey ? null : bearerToken,
        });
        const uploaded = await uploadSellVideoAndPoster({
          client: storageClient,
          userId: user.id,
          videoBuffer: buffer,
          videoMime: mime,
          safeFileName: safe,
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
      const fileName = `${Date.now()}_${safe}`;
      const diskPath = path.join(diskDir, fileName);
      await writeFile(diskPath, buffer);
      publicSrc = `/${relDir.replace(/\\/g, "/")}/${fileName}`;
      posterForDb = DEFAULT_POSTER;
    }
  } else if (hasVideoUrl && canTrySupabaseStorage) {
    try {
      const storageClient = createStorageClient(url!, anonKey!, {
        serviceRoleKey,
        userJwt: serviceRoleKey ? null : bearerToken,
      });
      const thumb = await uploadSellPosterOnly(storageClient, user.id);
      if (thumb) posterForDb = thumb;
    } catch {
      /* 기본 포스터 유지 */
    }
  }

  const hashtagsNormalized = hashtagsRaw
    ? hashtagsRaw
        .split(/[\s,]+/)
        .map((t) => t.replace(/^#+/, "").trim())
        .filter(Boolean)
        .slice(0, 24)
        .map((t) => `#${t}`)
        .join(",")
    : null;

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
