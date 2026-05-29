import { NextResponse } from "next/server";
import { reportReview } from "@/lib/reviews";
import { requireReviewUser } from "@/lib/reviewAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const { reviewId } = await params;
  const auth = await requireReviewUser(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const body = (await req.json().catch(() => null)) as { reason?: string } | null;
  const reason =
    typeof body?.reason === "string" && body.reason.trim()
      ? body.reason.trim()
      : "reported_by_user";

  try {
    const ok = await reportReview({
      reviewId,
      reporterId: auth.user.id,
      reason,
    });
    if (!ok) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}
