import { ShopPageClient } from "@/components/ShopPageClient";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.shop",
    descriptionKey: "meta.shopDescription",
  });
}

/** 쇼핑몰 — 카테고리·필터·그리드(카테고리 페이지와 동일 UX) */
export default function ShopPage() {
  return <ShopPageClient />;
}
