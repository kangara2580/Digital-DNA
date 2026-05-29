import { ensureProfileSellerBioColumn } from "@/lib/ensureProfileSellerBioColumn";
import { resolveStoredProfileColor } from "@/lib/profileColorSpectrum";
import {
  type ReviewAuthorProfile,
  reviewAuthorFeedHref,
} from "@/lib/reviewAuthorProfileShared";
import { getSupabaseServiceRoleClient } from "@/lib/supabaseServiceRole";
import { supabaseTables } from "@/lib/supabaseTableNames";

export type { ReviewAuthorProfile } from "@/lib/reviewAuthorProfileShared";
export { reviewAuthorFeedHref } from "@/lib/reviewAuthorProfileShared";

export function buildReviewAuthorProfile(
  userId: string,
  nickname: string,
  row: {
    nickname?: string | null;
    avatar_kind?: string | null;
    avatar_seed?: string | null;
    avatar_custom?: string | null;
  } | null,
): ReviewAuthorProfile {
  const displayName = row?.nickname?.trim() || nickname.trim() || "guest";
  return {
    userId,
    displayName,
    avatarKind: row?.avatar_kind?.trim() || null,
    avatarSeed: row?.avatar_seed?.trim() || null,
    avatarCustom: row?.avatar_custom?.trim() || null,
    profileColor: resolveStoredProfileColor(
      row?.avatar_kind,
      row?.avatar_seed,
      userId,
    ),
  };
}

export async function loadReviewAuthorProfiles(
  userIds: string[],
  nicknameByUserId: Map<string, string>,
): Promise<Map<string, ReviewAuthorProfile>> {
  const unique = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];
  const result = new Map<string, ReviewAuthorProfile>();
  if (unique.length === 0) return result;

  try {
    await ensureProfileSellerBioColumn();
    const admin = getSupabaseServiceRoleClient();
    if (!admin) {
      for (const userId of unique) {
        result.set(
          userId,
          buildReviewAuthorProfile(userId, nicknameByUserId.get(userId) ?? "", null),
        );
      }
      return result;
    }

    const { data } = await admin
      .from(supabaseTables.profiles)
      .select("user_id,nickname,avatar_kind,avatar_seed,avatar_custom")
      .in("user_id", unique);

    const rowByUser = new Map(
      ((data ?? []) as Array<{
        user_id: string;
        nickname?: string | null;
        avatar_kind?: string | null;
        avatar_seed?: string | null;
        avatar_custom?: string | null;
      }>).map((row) => [row.user_id, row]),
    );

    for (const userId of unique) {
      result.set(
        userId,
        buildReviewAuthorProfile(
          userId,
          nicknameByUserId.get(userId) ?? "",
          rowByUser.get(userId) ?? null,
        ),
      );
    }
  } catch {
    for (const userId of unique) {
      result.set(
        userId,
        buildReviewAuthorProfile(userId, nicknameByUserId.get(userId) ?? "", null),
      );
    }
  }

  return result;
}
