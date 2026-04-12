import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { resolveMediaInputForReplicate } from "@/lib/replicateMediaInput";
import {
  REPLICATE_RATE_LIMIT_USER_MESSAGE_KO,
  getReplicateErrorStatus,
  runReplicateWith429Retry,
} from "@/lib/replicateRunWithRetry";
import { getReplicateApiToken } from "@/lib/replicateToken";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TransformRequestBody = {
  sourceImageUrl?: string;
  targetVideoUrl?: string;
  backgroundPrompt?: string;
};

/**
 * `insightface/faceswap` 는 Replicate API에서 404(삭제/비공개).
 * 동일 입력 스키마(`source_image`, `target_video`)를 쓰는 공개 모델로 교체.
 * @see https://replicate.com/ddvinh1/video-faceswap-gpu
 */
const DEFAULT_VIDEO_FACE_SWAP_MODEL =
  "ddvinh1/video-faceswap-gpu:50a0a0018673852629578e627576326036b407e0dbd8cf8a0b5028296726dc5c" as const;

type ReplicateModelRef = `${string}/${string}` | `${string}/${string}:${string}`;

function videoFaceSwapModelRef(): ReplicateModelRef {
  const v = process.env.REPLICATE_VIDEO_FACE_SWAP_MODEL?.trim();
  return (v || DEFAULT_VIDEO_FACE_SWAP_MODEL) as ReplicateModelRef;
}

function getReplicateClient(): Replicate | null {
  const token = getReplicateApiToken();
  if (!token) return null;
  return new Replicate({ auth: token });
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

export async function POST(request: NextRequest) {
  const client = getReplicateClient();
  if (!client) {
    return NextResponse.json(
      {
        error: "replicate_token_missing",
        message:
          "Replicate API 토큰이 없습니다. .env.local에 REPLICATE_API_TOKEN=r8_... 를 설정하세요. REPLICATE_API_TOKEN=\"\"처럼 빈 값만 두면 다른 env 파일의 값까지 덮어씌워집니다 — 사용하지 않으면 해당 줄을 삭제하세요.",
      },
      { status: 500 },
    );
  }

  let body: TransformRequestBody;
  try {
    body = (await request.json()) as TransformRequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const sourceImageUrl =
    typeof body.sourceImageUrl === "string" ? body.sourceImageUrl.trim() : "";
  const targetVideoUrl =
    typeof body.targetVideoUrl === "string" ? body.targetVideoUrl.trim() : "";
  const backgroundPrompt =
    typeof body.backgroundPrompt === "string" ? body.backgroundPrompt.trim() : "";

  if (!sourceImageUrl || !targetVideoUrl) {
    return NextResponse.json(
      { error: "sourceImageUrl_and_targetVideoUrl_required" },
      { status: 400 },
    );
  }

  try {
    const [sourceInput, targetInput] = await Promise.all([
      resolveMediaInputForReplicate(sourceImageUrl, "source_image"),
      resolveMediaInputForReplicate(targetVideoUrl, "target_video"),
    ]);

    let faceSwapOutput: unknown;
    try {
      faceSwapOutput = await runReplicateWith429Retry(() =>
        client.run(videoFaceSwapModelRef(), {
          input: {
            source_image: sourceInput,
            target_video: targetInput,
            enhance: true,
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

    const outputVideoUrl = extractUrl(faceSwapOutput);
    if (!outputVideoUrl) {
      return NextResponse.json(
        { error: "no_output_video_from_faceswap" },
        { status: 502 },
      );
    }

    let backgroundOutputUrl: string | null = null;
    let backgroundWarning: string | null = null;
    if (backgroundPrompt) {
      try {
        const bgOutput = await runReplicateWith429Retry(() =>
          client.run("black-forest-labs/flux-schnell", {
            input: {
              prompt: backgroundPrompt,
              output_format: "jpg",
            },
          }),
        );
        backgroundOutputUrl = extractUrl(bgOutput);
      } catch (bgErr) {
        if (isRateLimitError(bgErr)) {
          backgroundWarning =
            "현재 생성 요청이 많아 배경 이미지 생성을 건너뛰었습니다. 얼굴 스왑 영상만 반영되었습니다.";
        } else {
          throw bgErr;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      outputVideoUrl,
      backgroundOutputUrl,
      backgroundWarning,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "replicate_transform_failed";
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
      { error: isInput ? "invalid_media_input" : "replicate_transform_failed", message },
      { status: isInput ? 400 : 502 },
    );
  }
}
