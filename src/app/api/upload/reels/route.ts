import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type UploadReelsBody = {
  url?: unknown;
  is_ai_generated?: unknown;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * 판매자 릴스 URL 등록(데모) — 본문의 `is_ai_generated`를 검증·수신합니다.
 * 실서비스에서는 DB 저장·큐 연동 등으로 확장하세요.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UploadReelsBody;
    if (!isNonEmptyString(body.url)) {
      return NextResponse.json(
        { error: "url_required", message: "유효한 URL을 입력해 주세요." },
        { status: 400 },
      );
    }

    const isAiGenerated =
      body.is_ai_generated === true ||
      body.is_ai_generated === "true" ||
      body.is_ai_generated === 1;

    const url = body.url.trim();

    return NextResponse.json({
      ok: true,
      received: {
        url,
        is_ai_generated: Boolean(isAiGenerated),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "invalid_payload", message: "요청 본문을 읽을 수 없습니다." },
      { status: 400 },
    );
  }
}
