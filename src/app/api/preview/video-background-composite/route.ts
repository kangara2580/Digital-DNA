import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { resolveMediaInputForReplicate } from "@/lib/replicateMediaInput";
import {
  REPLICATE_RATE_LIMIT_USER_MESSAGE_KO,
  getReplicateErrorStatus,
  runReplicateWith429Retry,
} from "@/lib/replicateRunWithRetry";
import { getReplicateApiToken } from "@/lib/replicateToken";
import { searchBackgroundWithFallback } from "@/lib/videoFetcher";
import type { VideoSearchItem } from "@/lib/videoFetcher";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Robust Video Matting — 전경(사람) + 녹색 배경 등. @see https://replicate.com/arielreplicate/robust_video_matting */
const DEFAULT_RVM_MODEL =
  "arielreplicate/robust_video_matting:73d2128a371922d5d1abf0712a1d974be0e4e2358cc1218e4e34714767232bac" as const;

type Body = {
  subjectVideoUrl?: string;
  backgroundKeyword?: string;
  seed?: number;
};

function getReplicateClient(): Replicate | null {
  const token = getReplicateApiToken();
  if (!token) return null;
  return new Replicate({ auth: token });
}

/** Replicate `client.run` 제1인자 — 템플릿 리터럴 타입 요구(일반 string은 빌드 거부) */
type ReplicateModelRef = `${string}/${string}` | `${string}/${string}:${string}`;

function rvmModelRef(): ReplicateModelRef {
  const v = process.env.REPLICATE_ROBUST_VIDEO_MATTING_MODEL?.trim();
  return (v || DEFAULT_RVM_MODEL) as ReplicateModelRef;
}

function extractUrl(out: unknown): string | null {
  if (typeof out === "string") return out;
  if (Array.isArray(out)) {
    for (const item of out) {
      const u = extractUrl(item);
      if (u) return u;
    }
    return null;
  }
  if (out && typeof out === "object") {
    const o = out as Record<string, unknown>;
    if (typeof o.url === "string") return o.url;
    if (typeof o.output === "string") return o.output;
    if (typeof o.url === "function") {
      try {
        const u = (o.url as () => unknown)();
        if (typeof u === "string") return u;
      } catch {
        /* ignore */
      }
    }
  }
  return null;
}

function isRateLimitError(error: unknown): boolean {
  const st = getReplicateErrorStatus(error);
  const msg = error instanceof Error ? error.message : String(error);
  return (
    st === 429 ||
    msg.includes("429") ||
    msg.includes("Too Many Requests") ||
    msg.includes("throttled")
  );
}

/**
 * 동영상 배경 미리보기: 원본(또는 얼굴 스왑) 클립에서 사람 전경을 분리하고,
 * 프롬프트로 검색한 스톡 영상을 뒤에 깔아 합성에 필요한 URL을 반환합니다.
 * (클라이언트에서 녹색 배경 전경 + 배경 영상을 크로마키 합성)
 */
export async function POST(request: NextRequest) {
  const client = getReplicateClient();
  if (!client) {
    return NextResponse.json(
      {
        error: "replicate_token_missing",
        message:
          "Replicate API 토큰이 없습니다. .env.local에 REPLICATE_API_TOKEN을 설정하세요.",
      },
      { status: 500 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const subjectVideoUrl =
    typeof body.subjectVideoUrl === "string" ? body.subjectVideoUrl.trim() : "";
  const backgroundKeyword =
    typeof body.backgroundKeyword === "string" ? body.backgroundKeyword.trim() : "";
  const seed = typeof body.seed === "number" && Number.isFinite(body.seed) ? body.seed : 0;

  if (!subjectVideoUrl) {
    return NextResponse.json({ error: "subjectVideoUrl_required" }, { status: 400 });
  }
  if (!backgroundKeyword) {
    return NextResponse.json({ error: "backgroundKeyword_required" }, { status: 400 });
  }

  let items: VideoSearchItem[];
  try {
    const merged = await searchBackgroundWithFallback(backgroundKeyword, 40, seed, "video");
    items = merged as VideoSearchItem[];
  } catch (e) {
    const message = e instanceof Error ? e.message : "background_search_failed";
    return NextResponse.json(
      { error: "background_search_failed", message },
      { status: 502 },
    );
  }

  const backgroundCandidates = items
    .map((x) => x.videoUrl)
    .filter((u): u is string => Boolean(u));
  if (backgroundCandidates.length === 0) {
    return NextResponse.json(
      { error: "no_background_video", message: "검색된 배경 영상이 없습니다." },
      { status: 404 },
    );
  }

  const backgroundVideoUrl = backgroundCandidates[0]!;

  try {
    const videoInput = await resolveMediaInputForReplicate(subjectVideoUrl, "input_video");

    let rvmOutput: unknown;
    try {
      rvmOutput = await runReplicateWith429Retry(() =>
        client.run(rvmModelRef(), {
          input: {
            input_video: videoInput,
          },
        }),
      );
    } catch (e) {
      if (isRateLimitError(e)) {
        return NextResponse.json(
          {
            error: "replicate_rate_limited",
            message: REPLICATE_RATE_LIMIT_USER_MESSAGE_KO,
          },
          { status: 429 },
        );
      }
      throw e;
    }

    const foregroundVideoUrl = extractUrl(rvmOutput);
    if (!foregroundVideoUrl) {
      return NextResponse.json(
        { error: "no_foreground_video", message: "영상에서 전경을 추출하지 못했습니다." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      foregroundVideoUrl,
      backgroundVideoUrl,
      backgroundCandidates,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "video_matting_failed";
    if (isRateLimitError(error)) {
      return NextResponse.json(
        {
          error: "replicate_rate_limited",
          message: REPLICATE_RATE_LIMIT_USER_MESSAGE_KO,
        },
        { status: 429 },
      );
    }
    const isInput =
      typeof message === "string" &&
      (message.endsWith("_empty") ||
        message.endsWith("_invalid_path") ||
        message.endsWith("_path_outside_public") ||
        message.endsWith("_file_not_found") ||
        message === "invalid_data_url");
    return NextResponse.json(
      { error: isInput ? "invalid_media_input" : "video_matting_failed", message },
      { status: isInput ? 400 : 502 },
    );
  }
}
