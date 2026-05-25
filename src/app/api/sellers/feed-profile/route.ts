import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { decodeDevUserIdFromJwt } from "@/lib/devJwtFallback";
import { ensureProfileSellerBioColumn } from "@/lib/ensureProfileSellerBioColumn";
import { loadSellerFeedProfile } from "@/lib/loadSellerFeedProfile";
import {
  profileAvatarToAuthMetaPatch,
  type ProfileAvatar,
} from "@/lib/profileAvatarStorage";
import { normalizeProfileColorHex } from "@/lib/profileColorSpectrum";
import { sellerProfileColorFromRecord } from "@/lib/sellerProfile";
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

function normalizeNickname(raw: unknown): string | null {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (!text) return null;
  return text.slice(0, 32);
}

function parseColorAvatarPatch(
  avatarKind: unknown,
  avatarSeed: unknown,
): Pick<
  { avatar_kind: string; avatar_seed: string; avatar_custom: null },
  "avatar_kind" | "avatar_seed" | "avatar_custom"
> | null {
  if (avatarKind !== "color") return null;
  const hex = normalizeProfileColorHex(
    typeof avatarSeed === "string" ? avatarSeed : "",
  );
  if (!hex) return null;
  return { avatar_kind: "color", avatar_seed: hex, avatar_custom: null };
}

export async function GET(request: Request) {
  const sellerId = new URL(request.url).searchParams.get("sellerId")?.trim();
  if (!sellerId) {
    return NextResponse.json({ ok: false, error: "seller_id_required" }, { status: 400 });
  }

  const profile = await loadSellerFeedProfile(sellerId);
  const profileColor = sellerProfileColorFromRecord(
    {
      user_id: sellerId,
      avatar_kind: profile.avatarKind,
      avatar_seed: profile.avatarSeed,
    },
    sellerId,
  );
  const profileUploadUrl =
    profile.avatarKind === "upload" && profile.avatarCustom
      ? profile.avatarCustom
      : null;

  return NextResponse.json({
    ok: true,
    sellerBio: profile.sellerBio,
    nickname: profile.nickname,
    profileColor,
    profileUploadUrl,
    sellerSocialLinks: profile.sellerSocialLinks,
  });
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
  const body = (await request.json().catch(() => ({}))) as {
    sellerBio?: unknown;
    nickname?: unknown;
    avatarKind?: unknown;
    avatarSeed?: unknown;
  };
  const sellerBio = normalizeSellerBio(body.sellerBio);
  const nickname = normalizeNickname(body.nickname);
  const colorAvatar = parseColorAvatarPatch(body.avatarKind, body.avatarSeed);

  try {
    await ensureProfileSellerBioColumn();
  } catch {
    return NextResponse.json({ ok: false, error: "prepare_failed" }, { status: 500 });
  }
  const admin = getSupabaseServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const rowPatch: Record<string, unknown> = { user_id: userId, seller_bio: sellerBio };
  if (nickname != null) rowPatch.nickname = nickname;
  if (colorAvatar) {
    rowPatch.avatar_kind = colorAvatar.avatar_kind;
    rowPatch.avatar_seed = colorAvatar.avatar_seed;
    rowPatch.avatar_custom = colorAvatar.avatar_custom;
  }

  const { error } = await admin
    .from(supabaseTables.profiles)
    .upsert(rowPatch, { onConflict: "user_id" });
  if (error) {
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }

  const authMetaPatch: Record<string, unknown> = {};
  if (nickname != null) authMetaPatch.nickname = nickname;
  if (colorAvatar) {
    const avatar: ProfileAvatar = {
      kind: "color",
      hex: colorAvatar.avatar_seed,
    };
    Object.assign(authMetaPatch, profileAvatarToAuthMetaPatch(avatar));
  }
  if (Object.keys(authMetaPatch).length > 0) {
    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    const prevMeta = (authUser?.user?.user_metadata ?? {}) as Record<string, unknown>;
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: { ...prevMeta, ...authMetaPatch },
    });
  }

  const profile = await loadSellerFeedProfile(userId);
  const profileColor = sellerProfileColorFromRecord(
    {
      user_id: userId,
      avatar_kind: profile.avatarKind,
      avatar_seed: profile.avatarSeed,
    },
    userId,
  );
  const profileUploadUrl =
    profile.avatarKind === "upload" && profile.avatarCustom
      ? profile.avatarCustom
      : null;

  return NextResponse.json({
    ok: true,
    sellerBio: profile.sellerBio,
    nickname: profile.nickname,
    profileColor,
    profileUploadUrl,
  });
}
