import { Suspense } from "react";
import { MyPageDashboard } from "@/components/MyPageDashboard";

export const metadata = {
  title: "마이페이지 — REELS MARKET",
};

export default function MyPage() {
  return (
    <Suspense fallback={<main className="mx-auto min-h-[50vh] max-w-3xl px-4 py-12 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">불러오는 중…</main>}>
      <MyPageDashboard />
    </Suspense>
  );
}
