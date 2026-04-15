import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** 결제 단계 상단 — 구독 페이지로 돌아가기(아이콘만) */
export function CheckoutBackNav() {
  return (
    <div className="mt-3">
      <Link
        href="/subscribe"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-zinc-100 transition hover:border-reels-cyan/40 hover:bg-reels-cyan/10 hover:text-reels-cyan [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:border-reels-cyan/50 [html[data-theme='light']_&]:hover:bg-reels-cyan/10 [html[data-theme='light']_&]:hover:text-reels-cyan"
        aria-label="구독 페이지로 돌아가기"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden />
      </Link>
    </div>
  );
}
