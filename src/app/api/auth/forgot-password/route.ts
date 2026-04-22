import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { toE164 } from "@/lib/phoneE164";
import { verifySmsProofToken } from "@/lib/smsProof";

export const runtime = "nodejs";

type Body = {
  email?: string;
  phone?: string;
  countryCode?: string;
  smsProof?: string;
};

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return "";
  }
}

function buildCandidates(request: Request): string[] {
  const out: string[] = [];
  const fromEnv = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  const fromOrigin = normalizeBaseUrl(request.headers.get("origin") ?? "");
  const push = (base: string) => {
    if (!base) return;
    const redirect = `${base}/reset-password`;
    if (!out.includes(redirect)) out.push(redirect);
  };
  if (fromEnv) push(fromEnv);
  if (fromOrigin) push(fromOrigin);
  return out;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, message: "올바른 이메일 형식을 입력해 주세요." },
      { status: 400 },
    );
  }
  const phone = toE164(body.phone ?? "", body.countryCode);
  if (!phone) {
    return NextResponse.json(
      { ok: false, message: "휴대폰 번호 형식을 확인해 주세요." },
      { status: 400 },
    );
  }
  const proof = verifySmsProofToken({
    token: (body.smsProof ?? "").trim(),
    context: "forgot-password",
    phone,
  });
  if (!proof.ok) {
    return NextResponse.json(
      { ok: false, message: "SMS 인증이 만료되었거나 유효하지 않습니다. 다시 인증해 주세요." },
      { status: 401 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    return NextResponse.json(
      { ok: false, message: "Supabase 설정이 누락되었습니다." },
      { status: 503 },
    );
  }
  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let lastError = "";
  for (const redirectTo of buildCandidates(request)) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (!error) return NextResponse.json({ ok: true });
    lastError = error.message || lastError;
    if (!/invalid path specified/i.test(lastError)) break;
  }

  if (/invalid path specified/i.test(lastError)) {
    return NextResponse.json(
      { ok: false, message: "재설정 링크 URL 설정이 맞지 않습니다." },
      { status: 400 },
    );
  }
  return NextResponse.json(
    { ok: false, message: lastError || "메일 발송에 실패했습니다." },
    { status: 400 },
  );
}
