import { NextResponse } from "next/server";
import { translateKoToEnMymemoryBatch } from "@/lib/server/translateKoToEnMymemory";
import { textHasHangul } from "@/lib/textHasHangul";

export const runtime = "nodejs";

const MAX_ITEMS = 16;
const MAX_BODY = 500;

type BodyItem = { id?: string; text?: string };

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const items = (payload as { items?: BodyItem[] })?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ ok: false, error: "items_required" }, { status: 400 });
  }
  if (items.length > MAX_ITEMS) {
    return NextResponse.json({ ok: false, error: "too_many_items" }, { status: 400 });
  }

  const normalized: { id: string; text: string }[] = [];
  for (const it of items) {
    const id = typeof it.id === "string" ? it.id : "";
    const text = typeof it.text === "string" ? it.text : "";
    if (!id || text.length === 0 || text.length > MAX_BODY) {
      return NextResponse.json({ ok: false, error: "invalid_item" }, { status: 400 });
    }
    if (!textHasHangul(text)) {
      return NextResponse.json({ ok: false, error: "hangul_only" }, { status: 400 });
    }
    normalized.push({ id, text });
  }

  const translated = await translateKoToEnMymemoryBatch(normalized.map((n) => n.text));

  return NextResponse.json({
    ok: true,
    items: normalized.map((n, i) => ({
      id: n.id,
      text: translated[i] ?? n.text,
    })),
  });
}
