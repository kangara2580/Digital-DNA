import { parseSellerSocialBlob, type SellerSocialLink } from "@/lib/sellerSocialLinks";
import { ensureProfileSellerBioColumn } from "@/lib/ensureProfileSellerBioColumn";
import { isProbablySellerUserId } from "@/lib/sellerUserId";
import { getSupabaseServiceRoleClient } from "@/lib/supabaseServiceRole";
import { supabaseTables } from "@/lib/supabaseTableNames";

export type SellerFeedProfileSnapshot = {
  nickname: string | null;
  sellerBio: string | null;
  avatarKind: string | null;
  avatarSeed: string | null;
  avatarCustom: string | null;
  sellerSocialLinks: SellerSocialLink[];
};

export async function loadSellerFeedProfile(
  sellerKey: string,
): Promise<SellerFeedProfileSnapshot> {
  const empty: SellerFeedProfileSnapshot = {
    nickname: null,
    sellerBio: null,
    avatarKind: null,
    avatarSeed: null,
    avatarCustom: null,
    sellerSocialLinks: [],
  };

  try {
    await ensureProfileSellerBioColumn();
    const admin = getSupabaseServiceRoleClient();
    if (!admin) return empty;

    const { data } = await admin
      .from(supabaseTables.profiles)
      .select("nickname,seller_bio,avatar_kind,avatar_seed,avatar_custom")
      .eq("user_id", sellerKey)
      .maybeSingle();

    const row = (data ?? null) as {
      nickname?: string | null;
      seller_bio?: string | null;
      avatar_kind?: string | null;
      avatar_seed?: string | null;
      avatar_custom?: string | null;
    } | null;

    let sellerSocialLinks: SellerSocialLink[] = [];
    if (isProbablySellerUserId(sellerKey)) {
      const { data: socialRow } = await admin
        .from(supabaseTables.dataBlobs)
        .select("data")
        .eq("user_id", sellerKey)
        .eq("blob_key", "social_links")
        .maybeSingle();
      sellerSocialLinks = parseSellerSocialBlob(
        (socialRow as { data?: unknown } | null)?.data,
      );
    }

    return {
      nickname: row?.nickname?.trim() || null,
      sellerBio: row?.seller_bio?.trim() || null,
      avatarKind: row?.avatar_kind?.trim() || null,
      avatarSeed: row?.avatar_seed?.trim() || null,
      avatarCustom: row?.avatar_custom?.trim() || null,
      sellerSocialLinks,
    };
  } catch {
    return empty;
  }
}
