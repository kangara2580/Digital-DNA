import { NextResponse } from "next/server";
import twilio from "twilio";
import { toE164 } from "@/lib/phoneE164";
import type { SmsProofContext } from "@/lib/smsProof";

export const runtime = "nodejs";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 30;
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

function mapTwilioErrorMessage(error: unknown): string {
  const fallback = error instanceof Error ? error.message : "인증번호 발송에 실패했습니다.";
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "number"
      ? (error as { code: number }).code
      : null;

  if (code === 21608) {
    return "Twilio Trial 계정은 검증된 수신 번호로만 보낼 수 있습니다. Twilio Console > Verified Caller IDs 에서 대상 번호를 Verify 해 주세요.";
  }
  if (code === 21408) {
    return "Twilio에서 해당 국가(+82) SMS 권한이 비활성화되어 있습니다. Twilio Console > Messaging > Settings > Geo Permissions 에서 South Korea를 허용해 주세요.";
  }
  if (code === 20003) {
    return "Twilio 인증에 실패했습니다. TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN 값을 다시 확인해 주세요.";
  }
  if (code === 20404) {
    return "Twilio Verify Service SID를 찾을 수 없습니다. TWILIO_VERIFY_SERVICE_SID 값을 확인해 주세요.";
  }
  return fallback;
}

function validateTwilioConfig(input: {
  accountSid?: string;
  authToken?: string;
  verifyServiceSid?: string;
}): string | null {
  const { accountSid, authToken, verifyServiceSid } = input;
  if (!accountSid || !authToken || !verifyServiceSid) {
    return "서버 SMS 설정(Twilio Verify)이 아직 완료되지 않았습니다.";
  }
  if (!/^AC[a-zA-Z0-9]{32}$/.test(accountSid)) {
    return "TWILIO_ACCOUNT_SID 형식이 올바르지 않습니다. (예: AC...)";
  }
  if (!/^VA[a-zA-Z0-9]{32}$/.test(verifyServiceSid)) {
    return "TWILIO_VERIFY_SERVICE_SID 형식이 올바르지 않습니다. Verify Service SID(예: VA...)를 입력해 주세요.";
  }
  return null;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!allowRate(ip)) {
    return NextResponse.json(
      {
        ok: false,
        error: "too_many_requests",
        message: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
      },
      { status: 429 },
    );
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
  const configError = validateTwilioConfig({ accountSid, authToken, verifyServiceSid });
  if (configError) {
    return NextResponse.json(
      {
        ok: false,
        message: configError,
      },
      { status: 503 },
    );
  }
  const twilioAccountSid = accountSid as string;
  const twilioAuthToken = authToken as string;
  const twilioVerifyServiceSid = verifyServiceSid as string;

  try {
    const client = twilio(twilioAccountSid, twilioAuthToken);
    await client.verify.v2
      .services(twilioVerifyServiceSid)
      .verifications.create({ to: phone, channel: "sms" });
    return NextResponse.json({ ok: true, phone });
  } catch (e) {
    // 운영 로그에서 Twilio 원인 코드(21608/21408/20003/20404 등)를 즉시 식별하기 위한 최소 디버깅
    console.error("[sms/send] twilio verify error", e);
    const message = mapTwilioErrorMessage(e);
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
