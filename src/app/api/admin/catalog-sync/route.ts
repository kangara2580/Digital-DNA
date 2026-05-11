import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/adminAuth";
import { syncAllCatalogVideosToDb } from "@/lib/catalogSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const actor = await requireAdminAccess();
    const result = await syncAllCatalogVideosToDb(actor);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "catalog_sync_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
