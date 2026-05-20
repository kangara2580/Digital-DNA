import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  profileAvatarToAuthMetaPatch,
  type ProfileAvatar,
} from "@/lib/profileAvatarStorage";
import { getSupabaseServiceRoleClient } from "@/lib/supabaseServiceRole";
import { getSupabaseAuthCookieOptions } from "@/lib/supabaseCookieOptions";
import {
  applySupabaseAuthCookiesToStore,
  getSupabaseProjectRef,
} from "@/lib/supabaseAuthCookies";
import { upsertUserProfile } from "@/lib/supabaseProfiles";
import { updateAuthUserSafe } from "@/lib/supabaseAuthSerialize";

export const runtime = "nodejs";

const AVATAR_BUCKET = "avatars";
const MAX_IMAGE_BYTES = 2_500_000;

function parseDataUrl(dataUrl: string): { buffer: Buffer; contentType: string } | null {
  const trimmed = dataUrl.trim();
  const match = /^data:(image\/[a-zA-Z0-9+.-]+);base64,([\s\S]+)$/.exec(trimmed);
  if (!match) return null;
  const contentType = match[1].toLowerCase();
  if (!contentType.startsWith("image/")) return null;
  try {
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length < 1 || buffer.length > MAX_IMAGE_BYTES) return null;
    return { buffer, contentType };
  } catch {
    return null;
  }
}

function fileExt(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

/** 프로필 사진 — Storage에 업로드 후 DB에는 짧은 URL만 저장 */
export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 503 });
  }

  let dataUrl = "";
  try {
    const body = (await request.json()) as { dataUrl?: string };
    dataUrl = typeof body.dataUrl === "string" ? body.dataUrl : "";
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  if (!dataUrl.startsWith("data:image/")) {
    return NextResponse.json({ ok: false, error: "invalid_image" }, { status: 400 });
  }

  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    return NextResponse.json({ ok: false, error: "invalid_image" }, { status: 400 });
  }

  const projectRef = getSupabaseProjectRef(supabaseUrl);
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookieOptions: getSupabaseAuthCookieOptions(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        applySupabaseAuthCookiesToStore(cookieStore, cookiesToSet, projectRef);
      },
    },
  });

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseServiceRoleClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "server_config", detail: "missing_service_role" },
      { status: 503 },
    );
  }

  const ext = fileExt(parsed.contentType);
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadErr } = await admin.storage.from(AVATAR_BUCKET).upload(path, parsed.buffer, {
    contentType: parsed.contentType,
    upsert: true,
  });

  if (uploadErr) {
    const msg = uploadErr.message?.toLowerCase() ?? "";
    const bucketMissing = msg.includes("bucket") && msg.includes("not found");
    console.error("[POST /api/profile/avatar] storage upload failed", uploadErr.message);
    return NextResponse.json(
      {
        ok: false,
        error: bucketMissing ? "bucket_missing" : "upload_failed",
        detail: uploadErr.message,
      },
      { status: bucketMissing ? 503 : 500 },
    );
  }

  const publicUrl = admin.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
  if (!publicUrl) {
    return NextResponse.json({ ok: false, error: "no_public_url" }, { status: 500 });
  }

  const avatar: ProfileAvatar = { kind: "upload", dataUrl: publicUrl };
  const upserted = await upsertUserProfile(supabase, user.id, {
    avatar_kind: "upload",
    avatar_seed: null,
    avatar_custom: publicUrl,
  });

  if (!upserted) {
    console.error("[POST /api/profile/avatar] profiles upsert failed");
    return NextResponse.json({ ok: false, error: "profile_save_failed" }, { status: 500 });
  }

  const { error: authErr } = await updateAuthUserSafe(supabase, {
    data: profileAvatarToAuthMetaPatch(avatar),
  });
  if (authErr) {
    console.error("[POST /api/profile/avatar] auth meta update failed", authErr.message);
    return NextResponse.json({ ok: false, error: "auth_meta_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: publicUrl });
}
