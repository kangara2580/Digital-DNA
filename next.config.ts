import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** 대용량 동영상 업로드(판매 등록 API) — Server Actions 한도 참고 */
  experimental: {
    serverActions: {
      bodySizeLimit: "128mb",
    },
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
