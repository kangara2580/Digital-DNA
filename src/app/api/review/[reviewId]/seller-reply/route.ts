import { NextResponse } from "next/server";
import { upsertSellerReply } from "@/lib/reviews";
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

  const body = (await req.json().catch(() => null)) as { body?: string } | null;
  const replyBody = typeof body?.body === "string" ? body.body.trim() : "";
  if (replyBody.length < 1 || replyBody.length > 500) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  try {
    const review = await upsertSellerReply({
      reviewId,
      sellerId: auth.user.id,
      body: replyBody,
    });
    if (!review) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json({ ok: true, review });
  } catch {
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ reviewId: string }> },
) {
  return POST(req, ctx);
}
