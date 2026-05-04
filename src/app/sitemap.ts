import type { MetadataRoute } from "next";
import { CATEGORY_SLUGS } from "@/data/videoCatalog";
import { getSiteMetadataBase } from "@/lib/siteMetadataBase";

const STATIC_PATHS = [
  "",
  "/explore",
  "/shop",
  "/landing",
  "/search",
  "/login",
  "/auth",
  "/signup",
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/license",
  "/cookies",
  "/notice",
  "/sell",
  "/create",
  "/subscribe",
  "/subscribe/checkout",
  "/upload/reels",
  "/leaderboard",
  "/cart",
  "/settings",
  "/mypage",
  "/forgot-password",
  "/reset-password",
  "/login/find-id",
  "/likes",
  "/recent",
  "/wishlist",
  "/recharge",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteMetadataBase();
  const origin = base.origin.replace(/\/$/, "");
  const now = new Date();
  const urls: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: path === "" ? `${origin}/` : `${origin}${path}`,
    lastModified: now,
  }));

  for (const slug of CATEGORY_SLUGS) {
    urls.push({
      url: `${origin}/category/${slug}`,
      lastModified: now,
    });
  }

  return urls;
}
