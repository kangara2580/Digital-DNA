import { createClient } from "@supabase/supabase-js";
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
  if (!url || !anonKey) {
    return NextResponse.json(
      { ok: false, error: "Supabase 환경변수가 설정되어 있지 않습니다." },
      { status: 503 },
    );
  }

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

  const supabaseAuth = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error: userErr,
  } = await supabaseAuth.auth.getUser(token);
  if (userErr || !user) {
    return NextResponse.json(
      { ok: false, error: "세션이 유효하지 않습니다. 다시 로그인해 주세요." },
      { status: 401 },
    );
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
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { ok: false, error: "동영상 파일을 선택해 주세요." },
      { status: 400 },
    );
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(mime)) {
    return NextResponse.json(
      {
        ok: false,
        error: "지원하는 형식은 MP4, MOV, WebM, AVI 계열입니다.",
      },
      { status: 400 },
    );
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

  const buffer = Buffer.from(await file.arrayBuffer());
  const safe = sanitizeFilename(file.name || "clip.mp4");
  const relDir = path.posix.join("uploads", "sell", user.id);
  const diskDir = path.join(process.cwd(), "public", relDir);
  await mkdir(diskDir, { recursive: true });
  const fileName = `${Date.now()}_${safe}`;
  const diskPath = path.join(diskDir, fileName);
  await writeFile(diskPath, buffer);

  const publicSrc = `/${relDir.replace(/\\/g, "/")}/${fileName}`;

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
      poster: DEFAULT_POSTER,
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
