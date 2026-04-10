import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TransformRequestBody = {
  prompt?: string;
  inputImageUrl?: string;
  model?: string;
  input?: Record<string, unknown>;
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

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ error: "prompt_required" }, { status: 400 });
  }

  /**
   * TODO:
   * 1) body.model 허용 목록(allow-list) 검증
   * 2) client.predictions.create(...)로 실제 변환 요청
   * 3) prediction id 저장 및 상태 폴링 API(GET) 연동
   */
  return NextResponse.json({
    ok: true,
    message: "Transform route scaffold is ready.",
    received: {
      prompt,
      hasInputImageUrl:
        typeof body.inputImageUrl === "string" &&
        body.inputImageUrl.trim().length > 0,
      model: body.model ?? null,
      hasInput: !!body.input && typeof body.input === "object",
    },
  });
}
