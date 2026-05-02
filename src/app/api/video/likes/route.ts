import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { decodeDevUserIdFromJwt } from "@/lib/devJwtFallback";
import { canonicalFavoriteVideoId } from "@/lib/favoriteVideoId";
import { getSupabaseServiceRoleClient } from "@/lib/supabaseServiceRole";
import { supabaseTables } from "@/lib/supabaseTableNames";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const SUPABASE_TIMEOUT_MS = 450;

function parseVideoIdFromUrl(request: Request): string | null {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("videoId")?.trim() ?? "";
  if (raw.length === 0) return null;
  return canonicalFavoriteVideoId(raw);
}

async function withTimeout<T>(work: Promise<T> | PromiseLike<T>, timeoutMs: number): Promise<T> {
  return await Promise.race([
    Promise.resolve(work),
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("supabase_timeout")), timeoutMs);
    }),
  ]);
}

async function parseVideoIdFromBody(request: Request): Promise<string | null> {
  try {
    const body = (await request.json().catch(() => ({}))) as { videoId?: unknown };
    const raw = typeof body.videoId === "string" ? body.videoId.trim() : "";
    if (raw.length === 0) return null;
    return canonicalFavoriteVideoId(raw);
  } catch {
    return null;
  }
}

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
  } = await withTimeout(supabaseAuth.auth.getUser(token), SUPABASE_TIMEOUT_MS);
  if (error || !user) return null;
  return user.id;
}

async function fetchInternalLikeCount(videoId: string): Promise<number> {
  const admin = getSupabaseServiceRoleClient();
  if (!admin) return 0;
  try {
    const { count } = await withTimeout(
      admin
        .from(supabaseTables.favorites)
        .select("id", { count: "exact", head: true })
        .eq("video_id", videoId)
        .eq("kind", "like"),
      SUPABASE_TIMEOUT_MS,
    );
    return Math.max(0, count ?? 0);
  } catch {
    return 0;
  }
}

async function fetchLikedByUser(videoId: string, userId: string): Promise<boolean> {
  const admin = getSupabaseServiceRoleClient();
  if (!admin) return false;
  try {
    const { count } = await withTimeout(
      admin
        .from(supabaseTables.favorites)
        .select("id", { count: "exact", head: true })
        .eq("video_id", videoId)
        .eq("kind", "like")
        .eq("user_id", userId),
      SUPABASE_TIMEOUT_MS,
    );
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const videoId = parseVideoIdFromUrl(request);
  if (!videoId) {
    return NextResponse.json({ ok: false, error: "video_id_required" }, { status: 400 });
  }

  const count = await fetchInternalLikeCount(videoId);
  const token = parseBearerToken(request);
  if (!token) {
    return NextResponse.json({ ok: true, internalLikes: count, likedByMe: false });
  }
  const userId = await resolveUserIdFromToken(token);
  if (!userId) {
    return NextResponse.json({ ok: true, internalLikes: count, likedByMe: false });
  }
  const likedByMe = await fetchLikedByUser(videoId, userId);
  return NextResponse.json({ ok: true, internalLikes: count, likedByMe });
}

export async function POST(request: Request) {
  const token = parseBearerToken(request);
  if (!token) {
    return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
  }
  const userId = await resolveUserIdFromToken(token);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 401 });
  }
  const videoId = await parseVideoIdFromBody(request);
  if (!videoId) {
    return NextResponse.json({ ok: false, error: "video_id_required" }, { status: 400 });
  }

  const admin = getSupabaseServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const { error } = await admin.from(supabaseTables.favorites).insert({
    user_id: userId,
    video_id: videoId,
    kind: "like",
  });
  if (error && error.code !== "23505") {
    return NextResponse.json({ ok: false, error: "insert_failed" }, { status: 500 });
  }

  const [internalLikes, likedByMe] = await Promise.all([
    fetchInternalLikeCount(videoId),
    fetchLikedByUser(videoId, userId),
  ]);
  return NextResponse.json({ ok: true, internalLikes, likedByMe });
}

export async function DELETE(request: Request) {
  const token = parseBearerToken(request);
  if (!token) {
    return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
  }
  const userId = await resolveUserIdFromToken(token);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 401 });
  }
  const videoId = await parseVideoIdFromBody(request);
  if (!videoId) {
    return NextResponse.json({ ok: false, error: "video_id_required" }, { status: 400 });
  }

  const admin = getSupabaseServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const { error } = await admin
    .from(supabaseTables.favorites)
    .delete()
    .eq("user_id", userId)
    .eq("video_id", videoId)
    .eq("kind", "like");
  if (error) {
    return NextResponse.json({ ok: false, error: "delete_failed" }, { status: 500 });
  }

  const [internalLikes, likedByMe] = await Promise.all([
    fetchInternalLikeCount(videoId),
    fetchLikedByUser(videoId, userId),
  ]);
  return NextResponse.json({ ok: true, internalLikes, likedByMe });
}

