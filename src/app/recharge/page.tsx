import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.subscribe",
    descriptionKey: "meta.subscribeDescription",
  });
}

/** 예전 URL 호환 — 구독·결제 페이지로 이동 */
export default function RechargeRedirectPage() {
  redirect("/subscribe");
}
