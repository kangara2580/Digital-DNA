import { createClient, type User } from "@supabase/supabase-js";
import { buildProfilePatchFromUser } from "@/lib/supabaseProfiles";
import { getProfilesTableName } from "@/lib/supabaseTableNames";

function normalizeSupabaseOrigin(raw: string | undefined): string | null {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

export async function syncProfileFromAuthUserAsServer(user: User): Promise<void> {
  const supabaseUrl = normalizeSupabaseOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    console.log("[profile-sync] missing server env", {
      supabaseUrlExists: Boolean(supabaseUrl),
      serviceRoleKeyExists: Boolean(serviceRoleKey),
      userId: user.id,
    });
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const patch = buildProfilePatchFromUser(user);
  const { error } = await supabase
    .from(getProfilesTableName())
    .upsert(
      {
        user_id: user.id,
        ...patch,
      },
      { onConflict: "user_id" },
    );

  if (error) {
    console.log("[profile-sync] service role upsert failed", {
      userId: user.id,
      emailExists: Boolean(user.email),
      message: error.message,
      code: error.code,
      details: error.details,
    });
  }
}
