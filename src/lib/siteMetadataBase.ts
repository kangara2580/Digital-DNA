/**
 * metadataBase, sitemap, robots 등 **절대 URL**의 기준입니다.
 *
 * 우선순위:
 * 1. `NEXT_PUBLIC_SITE_URL` — 프로덕션에서 **산 도메인(실제로 사용자에게 보이는 URL)** 을 넣는 것을 권장합니다.
 * 2. `VERCEL_URL` — 지금 이 배포의 호스트(`*.vercel.app` 등). 미리보기에서도 “이 빌드” 기준 URL이 됩니다.
 * 3. `VERCEL_PROJECT_PRODUCTION_URL` — Vercel이 주는 프로덕션 호스트(있을 때).
 * 4. 로컬 기본값 `http://localhost:3000`
 *
 * 예전 기본값 `https://ara.pink` 는 산 도메인과 섞이면 예전 배포/다른 사이트로 링크가 잡힐 수 있어 제거했습니다.
 */
function withProtocol(raw: string): string {
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export function getSiteMetadataBase(): URL {
  if (process.env.NODE_ENV === "development") {
    const devOrigin = process.env.NEXT_PUBLIC_DEV_AUTH_REDIRECT_ORIGIN?.trim();
    if (devOrigin) {
      try {
        return new URL(withProtocol(devOrigin));
      } catch {
        /* fall through */
      }
    }
  }

  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL?.trim(),
    process.env.VERCEL_URL?.trim()
      ? withProtocol(process.env.VERCEL_URL.trim())
      : null,
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim(),
    "http://localhost:3000",
  ];

  for (const c of candidates) {
    if (!c) continue;
    try {
      return new URL(withProtocol(c));
    } catch {
      continue;
    }
  }

  return new URL("http://localhost:3000");
}

/**
 * @deprecated `getSiteMetadataBase().origin` 을 사용하세요.
 * (미들웨어 등 레거시 호환 — 모듈 로드 시점의 `getSiteMetadataBase()` 결과입니다.)
 */
export const CANONICAL_SITE_ORIGIN = getSiteMetadataBase().origin;
