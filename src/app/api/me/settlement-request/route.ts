import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverSession";

export const dynamic = "force-dynamic";

type Body = {
  amount?: unknown;
  bankName?: unknown;
  accountNo?: unknown;
  accountHolder?: unknown;
};

function parseAmount(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.floor(raw);
  if (typeof raw === "string" && raw.trim().length > 0) {
    const n = Number(raw.replace(/,/g, ""));
    if (Number.isFinite(n)) return Math.floor(n);
  }
  return null;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  const amount = body ? parseAmount(body.amount) : null;

  if (amount == null || amount < 1000) {
    return NextResponse.json({ ok: false, error: "invalid_amount" }, { status: 400 });
  }

  const bankName =
    typeof body?.bankName === "string" ? body.bankName.trim().slice(0, 64) || null : null;
  const accountNo =
    typeof body?.accountNo === "string" ? body.accountNo.trim().slice(0, 64) || null : null;
  const accountHolder =
    typeof body?.accountHolder === "string"
      ? body.accountHolder.trim().slice(0, 64) || null
      : null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const rows = await tx.sellerEarning.findMany({
        where: {
          sellerId: user.id,
          status: "pending",
          availableAt: { lte: now },
        },
        orderBy: { availableAt: "asc" },
        select: { id: true, netAmount: true },
      });

      const availableSum = rows.reduce((acc, r) => acc + r.netAmount, 0);

      if (availableSum === 0) {
        return { ok: false as const, error: "no_available" as const };
      }
      if (availableSum !== amount) {
        return {
          ok: false as const,
          error: "full_amount_required" as const,
          availableAmount: availableSum,
        };
      }

      await tx.sellerSettlementRequest.create({
        data: {
          sellerId: user.id,
          amount,
          bankName,
          accountNo,
          accountHolder,
        },
      });

      await tx.sellerEarning.updateMany({
        where: { id: { in: rows.map((r) => r.id) } },
        data: { status: "settlement_requested" },
      });

      return { ok: true as const };
    });

    if (!result.ok) {
      if (result.error === "no_available") {
        return NextResponse.json({ ok: false, error: "no_available" }, { status: 400 });
      }
      return NextResponse.json(
        {
          ok: false,
          error: "full_amount_required",
          availableAmount: result.availableAmount,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[settlement-request]", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
