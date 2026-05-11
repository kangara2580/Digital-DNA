import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "demo_purchase_disabled",
      message:
        "Demo purchases are disabled. Use Toss checkout so Purchase, UserEntitlement, SellerEarning, and Admin records stay consistent.",
    },
    { status: 410 },
  );
}
