import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/adminAuth";
import { getAdminAnalytics } from "@/lib/adminAnalytics";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/analytics
 * Returns comprehensive analytics data for the admin dashboard.
 * Requires admin access (email/ID whitelist).
 */
export async function GET() {
  try {
    await requireAdminAccess();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unauthorized" },
      { status: 403 },
    );
  }

  try {
    const data = await getAdminAnalytics();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[admin-analytics] Query error:", err);
    return NextResponse.json(
      { error: "analytics_query_failed" },
      { status: 500 },
    );
  }
}
