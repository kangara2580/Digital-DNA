import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TransformRequestBody = {
  sourceImageUrl?: string;
  targetVideoUrl?: string;
  backgroundPrompt?: string;
};

function getReplicateClient(): Replicate | null {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token || token.trim().length === 0) return null;
  return new Replicate({ auth: token });
}

/**
 * Replicate 변환 API 라우트(뼈대).
 * - 토큰은 서버 환경변수(REPLICATE_API_TOKEN)에서만 읽습니다.
 * - 클라이언트에는 토큰을 절대 반환하지 않습니다.
 */
function extractUrl(out: unknown): string | null {
  if (typeof out === "string") return out;
  if (Array.isArray(out)) {
    const first = out.find((x) => typeof x === "string");
    return typeof first === "string" ? first : null;
  }
  if (out && typeof out === "object") {
    const o = out as Record<string, unknown>;
    if (typeof o.url === "string") return o.url;
    if (typeof o.output === "string") return o.output;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const client = getReplicateClient();
  if (!client) {
    return NextResponse.json(
      {
        error: "replicate_token_missing",
        message: "REPLICATE_API_TOKEN 환경 변수가 설정되지 않았습니다.",
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
    const faceSwapOutput = await client.run("insightface/faceswap", {
      input: {
        source_image: sourceImageUrl,
        target_video: targetVideoUrl,
      },
    });
    const outputVideoUrl = extractUrl(faceSwapOutput);
    if (!outputVideoUrl) {
      return NextResponse.json(
        { error: "no_output_video_from_faceswap" },
        { status: 502 },
      );
    }

    let backgroundOutputUrl: string | null = null;
    if (backgroundPrompt) {
      const bgOutput = await client.run("black-forest-labs/flux-schnell", {
        input: {
          prompt: backgroundPrompt,
          output_format: "jpg",
        },
      });
      backgroundOutputUrl = extractUrl(bgOutput);
    }

    return NextResponse.json({
      ok: true,
      outputVideoUrl,
      backgroundOutputUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "replicate_transform_failed";
    return NextResponse.json(
      { error: "replicate_transform_failed", message },
      { status: 502 },
    );
  }
}
