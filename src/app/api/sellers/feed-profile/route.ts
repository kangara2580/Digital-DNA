import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { decodeDevUserIdFromJwt } from "@/lib/devJwtFallback";
import { ensureProfileSellerBioColumn } from "@/lib/ensureProfileSellerBioColumn";
import { getSupabaseServiceRoleClient } from "@/lib/supabaseServiceRole";
import { supabaseTables } from "@/lib/supabaseTableNames";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

async function resolveUserIdFromToken(token: string): Promise<string | null> {
  const devUserId = decodeDevUserIdFromJwt(token);
  if (devUserId) return devUserId;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.length || !anonKey?.length) return null;
  const supabaseAuth = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

function normalizeSellerBio(raw: unknown): string | null {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (!text) return null;
  const compact = text.replace(/\s+/g, " ");
  return compact.slice(0, 240);
}

export async function GET(request: Request) {
  const sellerId = new URL(request.url).searchParams.get("sellerId")?.trim();
  if (!sellerId) {
    return NextResponse.json({ ok: false, error: "seller_id_required" }, { status: 400 });
  }

  try {
    await ensureProfileSellerBioColumn();
  } catch {
    return NextResponse.json({ ok: true, sellerBio: null });
  }
  const admin = getSupabaseServiceRoleClient();
  if (!admin) return NextResponse.json({ ok: true, sellerBio: null });

  const { data, error } = await admin
    .from(supabaseTables.profiles)
    .select("seller_bio")
    .eq("user_id", sellerId)
    .maybeSingle();
  if (error) return NextResponse.json({ ok: true, sellerBio: null });
  const sellerBio =
    typeof (data as { seller_bio?: unknown } | null)?.seller_bio === "string"
      ? ((data as { seller_bio?: string }).seller_bio ?? "").trim() || null
      : null;
  return NextResponse.json({ ok: true, sellerBio });
}

export async function PATCH(request: Request) {
  const token = parseBearerToken(request);
  if (!token) {
    return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
  }
  const userId = await resolveUserIdFromToken(token);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { sellerBio?: unknown };
  const sellerBio = normalizeSellerBio(body.sellerBio);

  try {
    await ensureProfileSellerBioColumn();
  } catch {
    return NextResponse.json({ ok: false, error: "prepare_failed" }, { status: 500 });
  }
  const admin = getSupabaseServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const { error } = await admin
    .from(supabaseTables.profiles)
    .upsert({ user_id: userId, seller_bio: sellerBio }, { onConflict: "user_id" });
  if (error) {
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, sellerBio });
}
