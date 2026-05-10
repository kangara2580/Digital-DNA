import type { MetadataRoute } from "next";
import { getSiteMetadataBase } from "@/lib/siteMetadataBase";

export default function manifest(): MetadataRoute.Manifest {
  const base = getSiteMetadataBase();
  return {
    name: "ARA — Digital DNA",
    short_name: "ARA",
    description:
      "ARA — Buy the Motion, Own the Moment · 모션을 사고, 순간을 소유하세요",
    start_url: `${base.origin}/`,
    display: "standalone",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
