import { NextResponse } from "next/server";
import { getProfilesTableName } from "@/lib/supabaseTableNames";
import { getSupabaseServiceRoleClient } from "@/lib/supabaseServiceRole";

export const runtime = "nodejs";

type Payload = {
  email?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;
    const email = (body.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { ok: false, message: "올바른 이메일 형식을 입력해 주세요." },
        { status: 400 },
      );
    }

    const admin = getSupabaseServiceRoleClient();
    if (!admin) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "서버 설정이 누락되어 이메일 중복 확인을 할 수 없습니다. (SUPABASE_SERVICE_ROLE_KEY)",
        },
        { status: 503 },
      );
    }

    const table = getProfilesTableName();
    const { data, error } = await admin
      .from(table)
      .select("email")
      .ilike("email", email)
      .limit(1);

    if (error) {
      return NextResponse.json(
        { ok: false, message: "이메일 중복 확인 중 오류가 발생했습니다." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      available: (data ?? []).length === 0,
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "이메일 중복 확인 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
