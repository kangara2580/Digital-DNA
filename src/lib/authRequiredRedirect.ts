"use client";

export function redirectToLoginStart(nextPath?: string) {
  if (typeof window === "undefined") return;
  const fallback =
    `${window.location.pathname}${window.location.search}${window.location.hash}` || "/";
  const next =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : fallback;
  window.location.assign(`/login?redirect=${encodeURIComponent(next)}`);
}
