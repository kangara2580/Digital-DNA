import { NextResponse } from "next/server";
import { getProfilesTableName } from "@/lib/supabaseTableNames";
import { maskEmail } from "@/lib/maskEmail";
import { toE164 } from "@/lib/phoneE164";
import { verifySmsProofToken } from "@/lib/smsProof";
import { getSupabaseServiceRoleClient } from "@/lib/supabaseServiceRole";

export const runtime = "nodejs";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 20;
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

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/** 가입 시 저장된 `phone` 필드(+국가코드 등)와 맞추기 위한 후보 문자열 */
function phoneCandidates(input: string): string[] {
  const raw = input.trim();
  if (!raw) return [];
  const d = digitsOnly(raw);
  if (d.length < 7) return [];
  const set = new Set<string>();
  const compact = raw.replace(/\s/g, "");
  if (compact.startsWith("+")) set.add(compact);
  set.add(`+${d}`);
  if (d.length >= 9 && d.startsWith("0")) {
    set.add(`+82${d.slice(1)}`);
  }
  if (d.length >= 10 && !d.startsWith("0")) {
    set.add(`+82${d}`);
  }
  if (d.startsWith("82") && d.length >= 11) {
    set.add(`+${d}`);
  }
  return [...set];
}

type Body = {
  nickname?: string;
  phone?: string;
  countryCode?: string;
  smsProof?: string;
};

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!allowRate(ip)) {
    return NextResponse.json(
      { ok: false, error: "too_many_requests" },
      { status: 429 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
  const phoneRaw = typeof body.phone === "string" ? body.phone.trim() : "";
  const phoneE164 = toE164(
    phoneRaw,
    typeof body.countryCode === "string" ? body.countryCode : undefined,
  );
  const phones = phoneE164 ? [...new Set([phoneE164, ...phoneCandidates(phoneRaw)])] : phoneCandidates(phoneRaw);
  const smsProof = typeof body.smsProof === "string" ? body.smsProof.trim() : "";

  if (!nickname && phones.length === 0) {
    return NextResponse.json(
      { ok: false, error: "nickname_or_phone_required" },
      { status: 400 },
    );
  }
  if (!phoneE164) {
    return NextResponse.json(
      { ok: false, message: "보안을 위해 휴대폰 번호와 SMS 인증이 필요합니다." },
      { status: 400 },
    );
  }
  if (!smsProof) {
    return NextResponse.json(
      { ok: false, message: "보안을 위해 휴대폰 SMS 인증을 먼저 완료해 주세요." },
      { status: 401 },
    );
  }
  const proof = verifySmsProofToken({
    token: smsProof,
    context: "find-email",
    phone: phoneE164,
  });
  if (!proof.ok) {
    return NextResponse.json(
      { ok: false, message: "SMS 인증이 만료되었거나 유효하지 않습니다. 다시 인증해 주세요." },
      { status: 401 },
    );
  }

  const admin = getSupabaseServiceRoleClient();
  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        error: "service_unconfigured",
        message:
          "서버에 SUPABASE_SERVICE_ROLE_KEY 가 설정되어 있어야 이메일 찾기를 사용할 수 있습니다.",
      },
      { status: 503 },
    );
  }

  const table = getProfilesTableName();

  let query = admin.from(table).select("email").limit(25);

  if (nickname && phones.length > 0) {
    query = query.ilike("nickname", nickname).in("phone", phones);
  } else if (nickname) {
    query = query.ilike("nickname", nickname);
  } else {
    query = query.in("phone", phones);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { ok: false, error: "lookup_failed", message: error.message },
      { status: 500 },
    );
  }

  const rows = (data ?? []).filter(
    (r): r is { email: string | null } =>
      r != null && typeof r === "object",
  );
  const emails = [
    ...new Set(
      rows
        .map((r) => (typeof r.email === "string" ? r.email.trim() : ""))
        .filter(Boolean),
    ),
  ];

  if (emails.length === 0) {
    return NextResponse.json({
      ok: true,
      found: false,
      message:
        "일치하는 계정을 찾지 못했습니다. 닉네임·휴대폰 번호를 가입 시와 동일하게 입력했는지 확인해 주세요.",
    });
  }

  if (emails.length > 1) {
    return NextResponse.json({
      ok: true,
      found: false,
      ambiguous: true,
      message:
        "동일한 정보로 여러 계정이 조회되었습니다. 고객 지원으로 문의해 주세요.",
    });
  }

  return NextResponse.json({
    ok: true,
    found: true,
    maskedEmail: maskEmail(emails[0]!),
    hint: "로그인 시 위 이메일 주소를 사용합니다.",
  });
}
