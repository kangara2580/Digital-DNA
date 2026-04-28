import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SupportTicket = {
  email: string;
  title: string;
  message: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<SupportTicket>;
  const email = (body.email ?? "").trim();
  const title = (body.title ?? "").trim();
  const message = (body.message ?? "").trim();

  if (!email || !title || !message) {
    return NextResponse.json({ ok: false, error: "필수 항목을 입력해 주세요." }, { status: 400 });
  }
  if (!email.includes("@")) {
    return NextResponse.json({ ok: false, error: "이메일 형식이 올바르지 않습니다." }, { status: 400 });
  }

  // 개발 단계: 최소 동작 구현. 추후 메일/헬프데스크 연동 포인트.
  console.log("[support-ticket]", {
    email,
    title,
    messagePreview: message.slice(0, 120),
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
