import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import {
  REPLICATE_RATE_LIMIT_USER_MESSAGE_KO,
  getReplicateErrorStatus,
  runReplicateWith429Retry,
} from "@/lib/replicateRunWithRetry";
import { getReplicateApiToken } from "@/lib/replicateToken";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

/**
 * 배경 AI(Flux 이미지)만 생성 — 얼굴 스왑 없음.
 */
export async function POST(request: NextRequest) {
  const client = getReplicateClient();
  if (!client) {
    return NextResponse.json(
      {
        error: "replicate_token_missing",
        message:
          "Replicate API 토큰이 없습니다. .env.local에 REPLICATE_API_TOKEN=r8_... 를 설정하세요.",
      },
      { status: 500 },
    );
  }

  let body: { prompt?: string };
  try {
    body = (await request.json()) as { prompt?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ error: "prompt_required" }, { status: 400 });
  }

  let backgroundOutputUrl: string | null = null;
  let backgroundWarning: string | null = null;

  try {
    try {
      const bgOutput = await runReplicateWith429Retry(() =>
        client.run("black-forest-labs/flux-schnell", {
          input: {
            prompt,
            output_format: "jpg",
          },
        }),
      );
      backgroundOutputUrl = extractUrl(bgOutput);
    } catch (bgErr) {
      if (isRateLimitError(bgErr)) {
        backgroundWarning = REPLICATE_RATE_LIMIT_USER_MESSAGE_KO;
      } else {
        throw bgErr;
      }
    }

    return NextResponse.json({
      ok: true,
      backgroundOutputUrl,
      backgroundWarning,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "replicate_background_failed";
    if (isRateLimitError(error)) {
      return NextResponse.json(
        {
          error: "replicate_rate_limited",
          message: REPLICATE_RATE_LIMIT_USER_MESSAGE_KO,
        },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: "replicate_background_failed", message },
      { status: 502 },
    );
  }
}
