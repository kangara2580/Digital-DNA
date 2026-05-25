import { NextRequest, NextResponse } from "next/server";

const store = new Map<string, { count: number; resetAt: number }>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

type RateLimitResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

export function checkRateLimit(
  request: NextRequest,
  opts: { windowMs: number; maxRequests: number; prefix: string },
): RateLimitResult {
  cleanup();

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const key = `${opts.prefix}:${ip}`;
  const now = Date.now();

  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true };
  }

  entry.count += 1;
  if (entry.count > opts.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      ok: false,
      response: NextResponse.json(
        { error: "too_many_requests", retryAfter },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        },
      ),
    };
  }

  return { ok: true };
}
