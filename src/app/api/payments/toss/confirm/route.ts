import { NextResponse } from "next/server";
import { applyTossConfirmedPayment } from "@/lib/commerceLedger";
import { getCurrentUser } from "@/lib/serverSession";
import { confirmTossPayment } from "@/lib/tossPayments";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "login_required", loginUrl: "/login" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    paymentKey?: string;
    orderId?: string;
    amount?: number | string;
  } | null;

  const paymentKey = body?.paymentKey?.trim();
  const orderId = body?.orderId?.trim();
  const amount = Number(body?.amount);

  if (!paymentKey || !orderId || !Number.isFinite(amount)) {
    return NextResponse.json({ ok: false, error: "invalid_confirm_payload" }, { status: 400 });
  }

  try {
    const tossPayment = await confirmTossPayment({
      paymentKey,
      orderId,
      amount,
    });

    const payment = await applyTossConfirmedPayment({
      paymentKey,
      orderId,
      amount,
      tossPayment,
    });

    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      productType: payment.productType,
      productKey: payment.productKey,
      targetId: payment.targetId,
    });
  } catch (error) {
    console.error("[toss.confirm] failed", {
      orderId,
      paymentKey,
      amount,
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        ok: false,
        error: "toss_confirm_failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
