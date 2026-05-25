import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /** 상위 폴더 lockfile 때문에 workspace root가 어긋나는 경우 방지 */
  outputFileTracingRoot: projectRoot,
  /**
   * dev 서버(.next)와 production build 산출물(.next-build)을 분리해
   * 동시/교차 실행 시 chunk·manifest 충돌(ENOENT, MODULE_NOT_FOUND)을 방지합니다.
   */
  distDir: process.env.VERCEL
    ? ".next"
    : process.env.NODE_ENV === "development"
      ? ".next"
      : ".next-build",
  /** 대용량 동영상 업로드 — Server Actions / 미들웨어 경로의 본문 버퍼 한도 */
  experimental: {
    serverActions: {
      bodySizeLimit: "128mb",
    },
    // 미들웨어가 실행되는 라우트에서만 적용 (Next 15+). /api 는 matcher에서 제외했지만 보험용.
    middlewareClientMaxBodySize: "128mb",
  },
  /**
   * Prisma는 서버 번들에 넣지 않음.
   * 포함되면 `.prisma/client` 동적 로드가 깨져 `/api/*` 에서 MODULE_NOT_FOUND(500)가 날 수 있음.
   * @see https://www.prisma.io/docs/guides/nextjs
   */
  serverExternalPackages: ["@prisma/client", "prisma"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "api.dicebear.com", pathname: "/**" },
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/favicon.ico",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/favicon.svg",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.tosspayments.com https://*.tiktok.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.replicate.com https://*.tiktok.com https://*.pexels.com https://*.pixabay.com https://api.polar.sh https://*.sentry.io https://*.tosspayments.com",
              "frame-src 'self' https://js.tosspayments.com https://*.tiktok.com https://www.youtube.com",
              "media-src 'self' blob: https:",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
