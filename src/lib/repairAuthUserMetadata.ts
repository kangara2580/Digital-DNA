import type { User } from "@supabase/supabase-js";
import { isOversizedAuthAvatarCustom } from "@/lib/profileAvatarStorage";
import { getSupabaseServiceRoleClient } from "@/lib/supabaseServiceRole";

/** Auth JWT에 들어간 거대 `avatar_custom` 제거 (DB 프로필 이미지는 유지) */
export async function repairOversizedAuthUserMetadata(
  user: User,
): Promise<boolean> {
  const meta = { ...(user.user_metadata ?? {}) } as Record<string, unknown>;
  if (!isOversizedAuthAvatarCustom(meta.avatar_custom)) return false;

  const admin = getSupabaseServiceRoleClient();
  if (!admin) return false;

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...meta,
      avatar_custom: null,
    },
  });
  return !error;
}
