import { resolveOAuthCallbackOriginBrowser } from "@/lib/oauthCallbackOrigin";
import { postLoginRedirectPath } from "@/lib/postLoginRedirect";

export function buildAuthCallbackRedirectTo(nextPath: string | null): string {
  if (typeof window === "undefined") return "";
  const next = postLoginRedirectPath(nextPath);
  const u = new URL("/auth/callback", resolveOAuthCallbackOriginBrowser());
  u.searchParams.set("next", next);
  return u.toString();
}
