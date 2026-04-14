import { redirect } from "next/navigation";

/** 예전 URL 호환 — 구독·결제 페이지로 이동 */
export default function RechargeRedirectPage() {
  redirect("/subscribe");
}
