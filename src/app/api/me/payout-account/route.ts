import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverSession";
import { validateCsrf } from "@/lib/csrf";

export const dynamic = "force-dynamic";

function str(raw: unknown, max: number): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  return s.slice(0, max);
}

export async function POST(request: NextRequest) {
  const csrf = validateCsrf(request);
  if (!csrf.ok) return csrf.response;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const bankName = str(body?.bankName, 64);
  const accountNo = str(body?.accountNo, 64);
  const accountHolder = str(body?.accountHolder, 64);

  if (!bankName || !accountNo || !accountHolder) {
    return NextResponse.json({ ok: false, error: "fields_required" }, { status: 400 });
  }

  try {
    await prisma.sellerPayoutAccount.upsert({
      where: { sellerId: user.id },
      create: {
        sellerId: user.id,
        bankName,
        accountNo,
        accountHolder,
      },
      update: {
        bankName,
        accountNo,
        accountHolder,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[payout-account]", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
