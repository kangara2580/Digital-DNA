import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Prisma는 번들에 넣지 않음 — .prisma/client 동적 로드가 깨지면 MODULE_NOT_FOUND 발생 */
  serverExternalPackages: ["@prisma/client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "api.dicebear.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
