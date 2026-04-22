import { NextResponse } from "next/server";
import twilio from "twilio";
import { toE164 } from "@/lib/phoneE164";
import type { SmsProofContext } from "@/lib/smsProof";

export const runtime = "nodejs";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 10;
const rateBucket = new Map<string, { n: number; t: number }>();

function getClientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function allowRate(ip: string): boolean {
  const now = Date.now();
  const b = rateBucket.get(ip);
  if (!b || now - b.t > WINDOW_MS) {
    rateBucket.set(ip, { n: 1, t: now });
    return true;
  }
  if (b.n >= MAX_PER_WINDOW) return false;
  b.n += 1;
  return true;
}

type Body = {
  phone?: string;
  countryCode?: string;
  context?: SmsProofContext;
};

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!allowRate(ip)) {
    return NextResponse.json({ ok: false, error: "too_many_requests" }, { status: 429 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const context = body.context;
  if (!context || !["signup", "forgot-password", "find-email"].includes(context)) {
    return NextResponse.json({ ok: false, error: "invalid_context" }, { status: 400 });
  }

  const phone = toE164(body.phone ?? "", body.countryCode);
  if (!phone) {
    return NextResponse.json(
      { ok: false, message: "휴대폰 번호 형식을 확인해 주세요." },
      { status: 400 },
    );
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();
  if (!accountSid || !authToken || !verifyServiceSid) {
    return NextResponse.json(
      {
        ok: false,
        message: "서버 SMS 설정(Twilio Verify)이 아직 완료되지 않았습니다.",
      },
      { status: 503 },
    );
  }

  try {
    const client = twilio(accountSid, authToken);
    await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({ to: phone, channel: "sms" });
    return NextResponse.json({ ok: true, phone });
  } catch (e) {
    const message = e instanceof Error ? e.message : "인증번호 발송에 실패했습니다.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
