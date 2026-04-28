import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { decodeDevUserIdFromJwt } from "@/lib/devJwtFallback";
import { createNotice, listNotices } from "@/lib/noticesRepo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function slugifyTitle(value: string): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 48);
  const stamp = Date.now().toString().slice(-6);
  return `${base || "notice"}-${stamp}`;
}

function parseWriterWhitelist(): string[] {
  return (process.env.NOTICE_WRITER_IDS ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

async function resolveUserFromToken(token: string): Promise<{
  id: string;
  email?: string | null;
} | null> {
  const devUserId = decodeDevUserIdFromJwt(token);
  if (devUserId) return { id: devUserId, email: null };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;

  const supabaseAuth = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser(token);
  if (error || !user) return null;
  return { id: user.id, email: user.email };
}

async function uploadNoticeImages(params: {
  files: File[];
  actorId: string;
  token: string | null;
}): Promise<string[]> {
  const { files, actorId, token } = params;
  if (files.length === 0) return [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error("storage_not_configured");
  }
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const client = createClient(url, serviceRoleKey || anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(serviceRoleKey
      ? {}
      : token
        ? { global: { headers: { Authorization: `Bearer ${token}` } } }
        : {}),
  });

  const uploaded: string[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const safeExt = (ext || "jpg").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "jpg";
    const path = `notices/${actorId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await client.storage.from("notice-images").upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });
    if (error) {
      throw new Error("notice_image_upload_failed");
    }
    const publicUrl = client.storage.from("notice-images").getPublicUrl(path).data.publicUrl;
    if (publicUrl) uploaded.push(publicUrl);
  }
  return uploaded;
}

export async function GET() {
  try {
    const notices = await listNotices();
    return NextResponse.json({ notices });
  } catch (error) {
    console.error("[GET /api/notices]", error);
    return NextResponse.json({ error: "failed_to_load_notices" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const title = String(form.get("title") ?? "").trim();
    const content = String(form.get("body") ?? "").trim();
    const pinnedRaw = String(form.get("pinned") ?? "").trim();
    const pinned = pinnedRaw === "true" || pinnedRaw === "on";
    const files = form
      .getAll("images")
      .filter((v): v is File => typeof File !== "undefined" && v instanceof File && v.size > 0);

    if (!title || !content) {
      return NextResponse.json({ error: "title_and_body_required" }, { status: 400 });
    }
    if (title.length > 120) {
      return NextResponse.json({ error: "title_too_long" }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";

    let actor: { id: string; email?: string | null } | null = null;
    if (token) {
      actor = await resolveUserFromToken(token);
      if (!actor) {
        return NextResponse.json({ error: "invalid_session" }, { status: 401 });
      }
    } else {
      actor = { id: "dev-local-writer", email: "dev-local@ara.local" };
    }

    const writerIds = parseWriterWhitelist();
    if (writerIds.length > 0 && actor && !writerIds.includes(actor.id)) {
      return NextResponse.json({ error: "not_allowed_writer" }, { status: 403 });
    }

    const id = slugifyTitle(title);
    const authorName = actor?.email ? actor.email.split("@")[0] : actor?.id ?? "writer";

    const imageUrls = await uploadNoticeImages({
      files,
      actorId: actor?.id ?? "writer",
      token: token || null,
    });

    await createNotice({
      id,
      title,
      body: content,
      imageUrls,
      pinned,
      authorId: actor?.id ?? null,
      authorName,
    });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("[POST /api/notices]", error);
    return NextResponse.json({ error: "failed_to_create_notice" }, { status: 500 });
  }
}
