import { NextResponse } from "next/server";
import { supabaseTables } from "@/lib/supabaseTableNames";
import { getSupabaseServiceRoleClient } from "@/lib/supabaseServiceRole";
import { parseSellerSocialBlob } from "@/lib/sellerSocialLinks";

export const runtime = "nodejs";

/** Supabase `auth.users` / `user_data_blobs.user_id` 에 쓰이는 UUID만 조회합니다. */
const AUTH_USER_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isQueryableSellerUserId(id: string): boolean {
  return AUTH_USER_ID_RE.test(id.trim());
}

function parseSellerIds(value: string | null): string[] {
  if (!value) return [];
  return [...new Set(value.split(",").map((x) => x.trim()).filter(Boolean))].slice(0, 50);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerIds = parseSellerIds(searchParams.get("sellerIds"));
    if (sellerIds.length === 0) {
      return NextResponse.json({ ok: true, linksBySellerId: {} });
    }

  const linksBySellerId: Record<string, ReturnType<typeof parseSellerSocialBlob>> = {};
  for (const id of sellerIds) {
    if (!isQueryableSellerUserId(id)) {
      linksBySellerId[id] = [];
    }
  }

  const uuidSellerIds = sellerIds.filter(isQueryableSellerUserId);
  if (uuidSellerIds.length === 0) {
    return NextResponse.json({ ok: true, linksBySellerId });
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
    .in("user_id", uuidSellerIds);

  if (error) {
    return NextResponse.json(
      { ok: false, message: "Failed to load seller social links." },
      { status: 500 },
    );
  }

  for (const row of (data ?? []) as { user_id: string; data: unknown }[]) {
    linksBySellerId[row.user_id] = parseSellerSocialBlob(row.data);
  }

  for (const id of uuidSellerIds) {
    if (!(id in linksBySellerId)) {
      linksBySellerId[id] = [];
    }
  }

    return NextResponse.json({ ok: true, linksBySellerId });
  } catch (err) {
    console.error("[sellers/social-links]", err);
    return NextResponse.json({ ok: false, error: "internal_server_error" }, { status: 500 });
  }
}
