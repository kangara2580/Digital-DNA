import { NextResponse } from "next/server";
import { listSellerReviews, type SellerReviewSort } from "@/lib/reviews";

function parseSellerReviewSort(value: string | null): SellerReviewSort {
  switch (value) {
    case "oldest":
    case "low_rating":
    case "high_rating":
      return value;
    default:
      return "latest";
  }
}
import { getCurrentUser } from "@/lib/serverSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId")?.trim() || undefined;
  const sort = parseSellerReviewSort(searchParams.get("sort"));
  try {
    const data = await listSellerReviews(user.id, { videoId, sort });
    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json(
      { ok: false, error: "db_error", videos: [], reviews: [] },
      { status: 500 },
    );
  }
}
