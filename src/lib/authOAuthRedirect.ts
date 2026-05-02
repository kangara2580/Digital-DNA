function resolveSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    const withProtocol = /^https?:\/\//i.test(configured)
      ? configured
      : `https://${configured}`;
    try {
      return new URL(withProtocol).origin;
    } catch {
      // Fall back to the current browser origin below.
    }
  }
  return window.location.origin;
}

export function buildAuthCallbackRedirectTo(nextPath: string | null): string {
  if (typeof window === "undefined") return "";
  const next =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
  const u = new URL("/auth/callback", resolveSiteOrigin());
  u.searchParams.set("next", next);
  return u.toString();
}
