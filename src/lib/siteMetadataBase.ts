/**
 * 공식 프로덕션 도메인 — `metadataBase`, sitemap, robots, manifest 등 절대 URL의 단일 기준.
 * Vercel/로컬에서 `NEXT_PUBLIC_SITE_URL`을 덮어쓸 수 있으나, 비어 있으면 항상 이 값을 사용합니다.
 */
export const CANONICAL_SITE_ORIGIN = "https://ara.pink";

/** 절대 origin URL (trailing path 없음). */
export function getSiteMetadataBase(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const candidate = raw || CANONICAL_SITE_ORIGIN;
  try {
    const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
    return new URL(withProtocol);
  } catch {
    return new URL(CANONICAL_SITE_ORIGIN);
  }
}
