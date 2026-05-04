import type { MetadataRoute } from "next";
import { getSiteMetadataBase } from "@/lib/siteMetadataBase";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteMetadataBase();
  const origin = base?.origin.replace(/\/$/, "");
  return {
    rules: { userAgent: "*", allow: "/" },
    ...(origin ? { sitemap: `${origin}/sitemap.xml`, host: base?.host } : {}),
  };
}
