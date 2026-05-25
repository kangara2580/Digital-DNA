import { generateCsrfTokenResponse } from "@/lib/csrf";

export const dynamic = "force-dynamic";

/**
 * GET /api/csrf-token
 * Returns a fresh CSRF token in both:
 * - JSON body (`csrfToken` field) — client reads this and sends it back as `X-CSRF-Token` header.
 * - HttpOnly cookie (`csrf_token`) — server compares against the header on subsequent POST requests.
 */
export function GET() {
  return generateCsrfTokenResponse();
}
