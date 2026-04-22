import { NextResponse } from "next/server";
import twilio from "twilio";
import { toE164 } from "@/lib/phoneE164";
import {
  createSmsProofToken,
  type SmsProofContext,
} from "@/lib/smsProof";

export const runtime = "nodejs";

type Body = {
  phone?: string;
  countryCode?: string;
  code?: string;
  context?: SmsProofContext;
};

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
  const code = (body.code ?? "").trim();
  if (!/^\d{4,8}$/.test(code)) {
    return NextResponse.json(
      { ok: false, message: "인증번호 형식을 확인해 주세요." },
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
    const check = await client.verify.v2
      .services(twilioVerifyServiceSid)
      .verificationChecks.create({ to: phone, code });
    if (check.status !== "approved") {
      return NextResponse.json(
        { ok: false, message: "인증번호가 올바르지 않거나 만료되었습니다." },
        { status: 400 },
      );
    }
    const proof = createSmsProofToken({ phone, context });
    if (!proof) {
      return NextResponse.json(
        { ok: false, message: "SMS 인증 토큰 생성에 실패했습니다." },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, phone, proof });
  } catch (e) {
    const message = e instanceof Error ? e.message : "인증번호 확인에 실패했습니다.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
