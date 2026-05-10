/**
 * Server-only: Korean → English via MyMemory (demo / low-volume).
 * Call only from Route Handlers — not for secrets or high QPS.
 */

import { textHasHangul } from "@/lib/textHasHangul";

const cache = new Map<string, string>();

const MAX_CHARS = 500;
const BETWEEN_MS = 220;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateOneInternal(trimmed: string): Promise<string> {
  const hit = cache.get(trimmed);
  if (hit !== undefined) return hit;

  const q = encodeURIComponent(trimmed.slice(0, MAX_CHARS));
  const url = `https://api.mymemory.translated.net/get?q=${q}&langpair=ko|en`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      cache.set(trimmed, trimmed);
      return trimmed;
    }
    const json = (await res.json()) as {
      responseData?: { translatedText?: string };
      quotaFinished?: boolean;
    };
    if (json.quotaFinished) {
      cache.set(trimmed, trimmed);
      return trimmed;
    }
    const out = json.responseData?.translatedText?.trim();
    const final = out && out.length > 0 ? out : trimmed;
    cache.set(trimmed, final);
    return final;
  } catch {
    cache.set(trimmed, trimmed);
    return trimmed;
  }
}

export async function translateKoToEnMymemory(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (!textHasHangul(trimmed)) {
    return text;
  }
  return translateOneInternal(trimmed);
}

export async function translateKoToEnMymemoryBatch(texts: string[]): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < texts.length; i++) {
    if (i > 0) await sleep(BETWEEN_MS);
    out.push(await translateKoToEnMymemory(texts[i] ?? ""));
  }
  return out;
}
