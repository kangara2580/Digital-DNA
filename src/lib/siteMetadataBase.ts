/** Absolute origin for `metadataBase` / sitemap / robots when configured. */
export function getSiteMetadataBase(): URL | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return undefined;
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProtocol);
  } catch {
    return undefined;
  }
}
