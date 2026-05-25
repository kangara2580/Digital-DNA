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
    background_color: "#050505",
    theme_color: "#FF2D8D",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
