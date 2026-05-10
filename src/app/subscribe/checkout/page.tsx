import { redirect } from "next/navigation";

/** 구독 결제 플로우 비활성 — 구매내역으로 안내 */
export default function SubscribeCheckoutPage() {
  redirect("/mypage?tab=purchases");
}
