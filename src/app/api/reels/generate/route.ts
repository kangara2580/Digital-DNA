import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getMarketVideoById } from "@/data/videoCommerce";
import { createJob, getJob } from "@/lib/reelsGenerate/jobStore";
import { runReelsGenerationPipeline } from "@/lib/reelsGenerate/pipeline";
import type {
  ReelsCustomizeDraft,
  ReelsGenerateRequestBody,
} from "@/lib/reelsGenerate/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST 본문은 빠르게 응답하고, 실제 생성은 백그라운드 파이프라인에서 진행합니다. */
export const maxDuration = 60;

function isDataUrlOrHttps(url: string): boolean {
  return (
    url.startsWith("https://") ||
    url.startsWith("http://") ||
    url.startsWith("data:image/")
  );
}

function isValidDraft(d: unknown): d is ReelsCustomizeDraft {
  if (!d || typeof d !== "object") return false;
  const o = d as Record<string, unknown>;
  if (!Array.isArray(o.overlays)) return false;
  for (const x of o.overlays) {
    if (!x || typeof x !== "object") return false;
    const t = x as Record<string, unknown>;
    if (typeof t.id !== "string" || typeof t.text !== "string") return false;
    if (typeof t.color !== "string" || typeof t.fontSize !== "number") return false;
    if (typeof t.fontFamily !== "string") return false;
    if (typeof t.topPct !== "number") return false;
  }
  return (
    (o.faceOptionId === null || typeof o.faceOptionId === "string") &&
    typeof o.backgroundPrompt === "string" &&
    typeof o.trimStart === "number" &&
    typeof o.trimEnd === "number"
  );
}

/**
 * POST — 맞춤 설정으로 영상 생성 작업을 큐에 넣습니다.
 * GET ?jobId= — 작업 상태 폴링 (queued | running | succeeded | failed)
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const b = body as Partial<ReelsGenerateRequestBody>;
  if (!b.videoId || typeof b.videoId !== "string") {
    return NextResponse.json({ error: "videoId_required" }, { status: 400 });
  }
  if (!b.faceImageUrl || typeof b.faceImageUrl !== "string" || !isDataUrlOrHttps(b.faceImageUrl)) {
    return NextResponse.json(
      { error: "faceImageUrl_required", hint: "https URL 또는 data:image/..." },
      { status: 400 },
    );
  }
  if (!isValidDraft(b.draft)) {
    return NextResponse.json({ error: "invalid_draft" }, { status: 400 });
  }

  const video = getMarketVideoById(b.videoId);
  if (!video) {
    return NextResponse.json({ error: "video_not_found" }, { status: 404 });
  }

  const jobId = randomUUID();
  const now = new Date().toISOString();

  createJob({
    id: jobId,
    status: "queued",
    createdAt: now,
    videoId: b.videoId,
    sourceVideoUrl: video.src,
    progress: 0,
    primaryProvider: "pending",
    stage: "queued",
    externalPredictionIds: {},
  });

  const payload: ReelsGenerateRequestBody & { sourceVideoUrl: string } = {
    videoId: b.videoId,
    faceImageUrl: b.faceImageUrl,
    draft: b.draft,
    sourceVideoUrl: video.src,
  };

  void runReelsGenerationPipeline(jobId, payload).catch((err) => {
    console.error("[reels/generate] pipeline", jobId, err);
  });

  const origin = request.nextUrl.origin;
  return NextResponse.json(
    {
      jobId,
      status: "queued" as const,
      stage: "queued" as const,
      pollUrl: `${origin}/api/reels/generate?jobId=${encodeURIComponent(jobId)}`,
    },
    { status: 202 },
  );
}

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "jobId_required" }, { status: 400 });
  }

  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "job_not_found" }, { status: 404 });
  }

  return NextResponse.json({ job });
}
