export type SellerSocialPlatform =
  | "tiktok"
  | "instagram"
  | "youtube"
  | "twitter"
  | "website";

export type SellerSocialLink = {
  platform: SellerSocialPlatform;
  url: string;
};

export function normalizeSellerSocialUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const u = new URL(withProtocol);
    if (!u.hostname) return null;
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

export function detectSellerSocialPlatform(url: string): SellerSocialPlatform {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.includes("tiktok.com")) return "tiktok";
    if (host.includes("instagram.com")) return "instagram";
    if (host.includes("youtube.com") || host === "youtu.be") return "youtube";
    if (host.includes("twitter.com") || host === "x.com") return "twitter";
    return "website";
  } catch {
    return "website";
  }
}

export function getSellerSocialPlatformFromInput(
  input: string,
): SellerSocialPlatform | null {
  const normalized = normalizeSellerSocialUrl(input);
  if (!normalized) return null;
  return detectSellerSocialPlatform(normalized);
}

export function normalizeSellerSocialLinksInput(rawLinks: string[]): SellerSocialLink[] {
  const out: SellerSocialLink[] = [];
  const seen = new Set<string>();
  for (const raw of rawLinks) {
    const url = normalizeSellerSocialUrl(raw);
    if (!url) continue;
    const platform = detectSellerSocialPlatform(url);
    const key = `${platform}::${url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ platform, url });
  }
  return out.slice(0, 20);
}

export function parseSellerSocialBlob(blob: unknown): SellerSocialLink[] {
  if (!Array.isArray(blob)) return [];
  const rawLinks = blob
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const maybeUrl = (item as { url?: unknown }).url;
      return typeof maybeUrl === "string" ? maybeUrl : "";
    })
    .filter(Boolean);
  return normalizeSellerSocialLinksInput(rawLinks);
}
