import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  /** 브라우저 기본 요청 `/favicon.ico` → public에 ico 없을 때 404 방지 */
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/favicon.svg",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
