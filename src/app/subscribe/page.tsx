import { redirect } from "next/navigation";

/** 구독 플로우 비활성 — 구매내역으로 안내 */
export default function SubscribePage() {
  redirect("/mypage?tab=purchases");
}
