import { NextResponse } from "next/server";
import { listReviewablePurchases } from "@/lib/reviews";
import { getCurrentUser } from "@/lib/serverSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
  }

  try {
    const items = await listReviewablePurchases(user.id);
    return NextResponse.json({ ok: true, items });
  } catch (err) {
    console.error("[reviewable-videos]", err);
    return NextResponse.json({ ok: false, error: "db_error", items: [] }, { status: 500 });
  }
}
