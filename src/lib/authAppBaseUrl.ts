import { getSiteMetadataBase } from "@/lib/siteMetadataBase";

function trimTrailingSlashes(s: string): string {
  return s.replace(/\/+$/, "");
}

function parseOrigin(raw: string | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

/**
 * 로그인·OAuth·문서 예시 등에서 쓰는 “앱 공개 베이스 URL” (origin만, 끝 슬래시 없음).
 *
 * 우선순위:
 * 1. `NEXTAUTH_URL` — NextAuth를 쓰지 않아도 로컬/스테이징에서 동일 키로 고정하기 위해 사용
 * 2. 개발: `NEXT_PUBLIC_DEV_AUTH_REDIRECT_ORIGIN`
 * 3. 개발 기본: `http://localhost:3000`
 * 4. 프로덕션: `getSiteMetadataBase().origin` (`NEXT_PUBLIC_SITE_URL` 등)
 */
export function getAuthAppBaseUrl(): string {
  const fromNextAuth = parseOrigin(process.env.NEXTAUTH_URL);
  if (fromNextAuth) return trimTrailingSlashes(fromNextAuth);

  if (process.env.NODE_ENV === "development") {
    const dev = parseOrigin(process.env.NEXT_PUBLIC_DEV_AUTH_REDIRECT_ORIGIN);
    if (dev) return trimTrailingSlashes(dev);
    return "http://localhost:3000";
  }

  return trimTrailingSlashes(getSiteMetadataBase().origin);
}
