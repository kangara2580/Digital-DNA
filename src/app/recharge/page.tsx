import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.mypage",
    descriptionKey: "meta.mypageDescription",
  });
}

/** 예전 URL 호환 — 구매내역으로 이동 */
export default function RechargeRedirectPage() {
  redirect("/mypage?tab=purchases");
}
