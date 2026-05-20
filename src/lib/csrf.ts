import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_BYTES = 32;

/**
 * Generate a CSRF token and attach it as an HttpOnly cookie.
 * Call this from `GET /api/csrf-token` so the client can read the header value.
 */
export function generateCsrfTokenResponse(): NextResponse {
  const token = randomBytes(TOKEN_BYTES).toString("hex");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";
  const isSecure =
    siteUrl.startsWith("https://") || process.env.NODE_ENV === "production";

  const res = NextResponse.json({ csrfToken: token });
  res.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });

  return res;
}

type CsrfResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

/**
 * Validate CSRF for a state-changing request (POST/PUT/PATCH/DELETE).
 *
 * Two checks:
 * 1. **Double-submit cookie** — `csrf_token` cookie must match `X-CSRF-Token` header.
 * 2. **Origin check** — `Origin` (or `Referer`) must match the site URL.
 *
 * If either check fails, a 403 response is returned.
 */
export function validateCsrf(request: NextRequest): CsrfResult {
  // --- Origin / Referer check ---
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    "";

  if (siteUrl) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const checkUrl = origin || referer || "";

    if (checkUrl) {
      try {
        const requestOrigin = new URL(checkUrl).origin;
        const expectedOrigin = new URL(siteUrl).origin;
        if (requestOrigin !== expectedOrigin) {
          return {
            ok: false,
            response: NextResponse.json(
              { error: "csrf_origin_mismatch" },
              { status: 403 },
            ),
          };
        }
      } catch {
        return {
          ok: false,
          response: NextResponse.json(
            { error: "csrf_invalid_origin" },
            { status: 403 },
          ),
        };
      }
    }
    // If no Origin/Referer header is present we still check the cookie token below.
  }

  // --- Double-submit cookie check ---
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "csrf_token_missing" },
        { status: 403 },
      ),
    };
  }

  if (cookieToken !== headerToken) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "csrf_token_mismatch" },
        { status: 403 },
      ),
    };
  }

  return { ok: true };
}
