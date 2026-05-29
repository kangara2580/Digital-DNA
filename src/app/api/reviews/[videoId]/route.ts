import { NextResponse } from "next/server";
import {
  assertBuyerCanReview,
  deleteUserReview,
  getUserReviewForVideo,
  listVideoReviews,
  upsertVideoReview,
  type ReviewSort,
} from "@/lib/reviews";
import { parseReviewInput, requireReviewUser } from "@/lib/reviewAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseSort(value: string | null): ReviewSort {
  return value === "rating" ? "rating" : "latest";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;
  const { searchParams } = new URL(req.url);
  const sort = parseSort(searchParams.get("sort"));

  try {
    const { reviews, stats } = await listVideoReviews(videoId, sort);
    let mine = null;
    const auth = await requireReviewUser(req);
    if (auth.ok) {
      mine = await getUserReviewForVideo(auth.user.id, videoId);
      const canWrite = await assertBuyerCanReview(auth.user.id, videoId);
      return NextResponse.json({
        ok: true,
        reviews,
        stats,
        mine,
        canWrite,
      });
    }
    return NextResponse.json({ ok: true, reviews, stats, mine: null, canWrite: false });
  } catch {
    return NextResponse.json({
      ok: false,
      reviews: [],
      stats: { count: 0, averageRating: null },
      mine: null,
      canWrite: false,
    });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;
  const auth = await requireReviewUser(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const parsed = parseReviewInput(await req.json().catch(() => null));
  if (!parsed) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  try {
    const purchased = await assertBuyerCanReview(auth.user.id, videoId);
    if (!purchased) {
      return NextResponse.json(
        { ok: false, error: "purchase_required" },
        { status: 403 },
      );
    }

    const review = await upsertVideoReview({
      videoId,
      userId: auth.user.id,
      nickname: parsed.nickname ?? auth.user.nickname,
      rating: parsed.rating,
      body: parsed.reviewBody,
    });

    return NextResponse.json({ ok: true, review });
  } catch {
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  return POST(req, { params });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;
  const auth = await requireReviewUser(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  try {
    const deleted = await deleteUserReview(auth.user.id, videoId);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}
