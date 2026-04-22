import { NextResponse } from "next/server";
import { supabaseTables } from "@/lib/supabaseTableNames";
import { getSupabaseServiceRoleClient } from "@/lib/supabaseServiceRole";
import { parseSellerSocialBlob } from "@/lib/sellerSocialLinks";

export const runtime = "nodejs";

function parseSellerIds(value: string | null): string[] {
  if (!value) return [];
  return [...new Set(value.split(",").map((x) => x.trim()).filter(Boolean))].slice(0, 50);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sellerIds = parseSellerIds(searchParams.get("sellerIds"));
  if (sellerIds.length === 0) {
    return NextResponse.json({ ok: true, linksBySellerId: {} });
  }

  const admin = getSupabaseServiceRoleClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, message: "SUPABASE_SERVICE_ROLE_KEY is required." },
      { status: 503 },
    );
  }

  const { data, error } = await admin
    .from(supabaseTables.dataBlobs)
    .select("user_id,data")
    .eq("blob_key", "social_links")
    .in("user_id", sellerIds);

  if (error) {
    return NextResponse.json(
      { ok: false, message: "Failed to load seller social links." },
      { status: 500 },
    );
  }

  const linksBySellerId: Record<string, ReturnType<typeof parseSellerSocialBlob>> = {};
  for (const row of (data ?? []) as { user_id: string; data: unknown }[]) {
    linksBySellerId[row.user_id] = parseSellerSocialBlob(row.data);
  }

  return NextResponse.json({ ok: true, linksBySellerId });
}
