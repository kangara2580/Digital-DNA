import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { decodeDevUserIdFromJwt } from "@/lib/devJwtFallback";
import { parseExternalMediaUrl } from "@/lib/externalEmbed/parseUrl";
import { videoRowToFeedVideo } from "@/lib/flashSaleVideos";
import { prisma } from "@/lib/prisma";
import { downloadMediaWithYtDlp, isDirectVideoFileUrl } from "@/lib/videoExtract/ytDlpDownload";

export const runtime = "nodejs";
/** yt-dlp + 업로드 — Vercel 등에서 제한을 넉넉히 */
export const maxDuration = 300;

function createServiceStorageClient(
  supabaseUrl: string,
  serviceRoleKey: string,
): SupabaseClient {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type Authed = { userId: string };

async function resolveAuthedUser(request: Request): Promise<Authed | Response> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const configured = Boolean(url?.trim() && anonKey?.trim());

  if (!configured) {
    return { userId: process.env.NEXT_PUBLIC_DEMO_SELLER_ID ?? "seller-demo" };
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
  if (!token) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }

  const supabaseAuth = createClient(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user: verifiedUser },
    error: userErr,
  } = await supabaseAuth.auth.getUser(token);
  if (userErr || !verifiedUser) {
    const fallbackUserId = decodeDevUserIdFromJwt(token);
    if (!fallbackUserId) {
      return NextResponse.json(
        { ok: false, error: "세션이 유효하지 않습니다. 다시 로그인해 주세요." },
        { status: 401 },
      );
    }
    return { userId: fallbackUserId };
  }
  return { userId: verifiedUser.id };
}

export async function POST(request: Request) {
  const auth = await resolveAuthedUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  let body: { videoId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const videoId = typeof body.videoId === "string" ? body.videoId.trim() : "";
  if (!videoId) {
    return NextResponse.json({ ok: false, error: "videoId가 필요합니다." }, { status: 400 });
  }

  const existing = await prisma.video.findUnique({ where: { id: videoId } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  if (existing.processedVideoUrl?.trim()) {
    return NextResponse.json({
      ok: true,
      status: "ready",
      video: videoRowToFeedVideo(existing),
    });
  }

  if (existing.processedVideoStatus === "skipped") {
    return NextResponse.json(
      {
        ok: false,
        error: "이 항목은 서버 MP4 추출 대상이 아닙니다.",
        video: videoRowToFeedVideo(existing),
      },
      { status: 400 },
    );
  }

  if (existing.processedVideoStatus === "processing") {
    return NextResponse.json({
      ok: true,
      status: "processing",
      video: videoRowToFeedVideo(existing),
    });
  }

  const src = existing.src.trim();

  if (isDirectVideoFileUrl(src) || src.startsWith("/")) {
    const updated = await prisma.video.update({
      where: { id: videoId },
      data: {
        processedVideoUrl: src,
        processedVideoStatus: "ready",
        processedVideoError: null,
      },
    });
    return NextResponse.json({
      ok: true,
      status: "ready",
      video: videoRowToFeedVideo(updated),
    });
  }

  const ext = parseExternalMediaUrl(src);
  if (!ext) {
    const failed = await prisma.video.update({
      where: { id: videoId },
      data: {
        processedVideoStatus: "failed",
        processedVideoError: "지원하지 않는 동영상 주소입니다.",
      },
    });
    return NextResponse.json(
      {
        ok: false,
        error: "unsupported_url",
        video: videoRowToFeedVideo(failed),
      },
      { status: 422 },
    );
  }

  const claim = await prisma.video.updateMany({
    where: {
      id: videoId,
      processedVideoStatus: { in: ["pending", "failed"] },
    },
    data: { processedVideoStatus: "processing", processedVideoError: null },
  });

  if (claim.count === 0) {
    const row = await prisma.video.findUnique({ where: { id: videoId } });
    if (!row) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      status: row.processedVideoStatus,
      video: videoRowToFeedVideo(row),
    });
  }

  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!sbUrl || !serviceRoleKey) {
    const row = await prisma.video.update({
      where: { id: videoId },
      data: {
        processedVideoStatus: "failed",
        processedVideoError:
          "Supabase Storage 업로드를 위해 SUPABASE_SERVICE_ROLE_KEY 를 설정해 주세요.",
      },
    });
    return NextResponse.json(
      {
        ok: false,
        error: "storage_not_configured",
        video: videoRowToFeedVideo(row),
      },
      { status: 503 },
    );
  }

  try {
    const { buffer, ext: fileExt } = await downloadMediaWithYtDlp(ext.pageUrl);
    const client = createServiceStorageClient(sbUrl, serviceRoleKey);
    const stamp = Date.now();
    const path = `processed/${videoId}/${stamp}_source.${fileExt}`;
    const contentType =
      fileExt === "webm"
        ? "video/webm"
        : fileExt === "mov"
          ? "video/quicktime"
          : "video/mp4";
    const { error: upErr } = await client.storage.from("videos").upload(path, buffer, {
      contentType,
      upsert: true,
    });
    if (upErr) {
      throw new Error(upErr.message);
    }
    const publicUrl = client.storage.from("videos").getPublicUrl(path).data.publicUrl;
    const updated = await prisma.video.update({
      where: { id: videoId },
      data: {
        processedVideoUrl: publicUrl,
        processedVideoStatus: "ready",
        processedVideoError: null,
      },
    });
    return NextResponse.json({
      ok: true,
      status: "ready",
      video: videoRowToFeedVideo(updated),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const updated = await prisma.video.update({
      where: { id: videoId },
      data: {
        processedVideoStatus: "failed",
        processedVideoError: msg.slice(0, 2000),
      },
    });
    return NextResponse.json(
      {
        ok: false,
        error: "extraction_failed",
        message: msg,
        video: videoRowToFeedVideo(updated),
      },
      { status: 502 },
    );
  }
}
