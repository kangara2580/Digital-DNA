import { Suspense } from "react";
import Link from "next/link";
import { CheckoutBackNav } from "@/components/subscribe/CheckoutBackNav";
import { SubscribeCheckoutFlow } from "@/components/subscribe/SubscribeCheckoutFlow";

export const metadata = {
  title: "결제 — REELS MARKET",
  description: "구독 결제 수단 등록과 결제 확인을 진행합니다.",
};

function CheckoutFallback() {
  return (
    <main className="mx-auto min-h-[50vh] max-w-6xl px-4 py-12 text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
      불러오는 중…
    </main>
  );
}

export default function SubscribeCheckoutPage() {
  return (
    <div className="min-h-[calc(100dvh-var(--header-height,4.5rem))] text-[var(--foreground,#fafafa)] [html[data-theme='light']_&]:bg-white [html[data-theme='dark']_&]:bg-transparent">
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6">
          <nav className="font-mono text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            <Link href="/" className="text-reels-cyan/90 hover:text-reels-cyan">
              홈
            </Link>
            <span className="mx-1.5 text-zinc-700 [html[data-theme='light']_&]:text-zinc-500">/</span>
            <Link href="/subscribe" className="text-reels-cyan/90 hover:text-reels-cyan">
              구독
            </Link>
            <span className="mx-1.5 text-zinc-700 [html[data-theme='light']_&]:text-zinc-500">/</span>
            <span className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">결제</span>
          </nav>
          <CheckoutBackNav />
        </header>
        <Suspense fallback={<CheckoutFallback />}>
          <SubscribeCheckoutFlow />
        </Suspense>
      </main>
    </div>
  );
}
