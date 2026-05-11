"use client";

import { useRouter } from "next/navigation";
import { SellerClipUploadForm } from "@/components/SellerClipUploadForm";
import { SellRegistrationModal } from "@/components/SellRegistrationModal";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTranslation } from "@/hooks/useTranslation";

/** 플로팅 계정·장바구니(h-11, top≈1rem) 아래로 폼 테두리가 들어가도록 여유 */
const SELL_PAGE_TOP_PAD =
  "pt-[max(4.75rem,calc(env(safe-area-inset-top)+3.5rem))] sm:pt-[max(5.25rem,calc(env(safe-area-inset-top)+3.75rem))]";

export function SellPageClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading, supabaseConfigured } = useAuthSession();

  const leaveSellGate = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
        {t("sell.loading")}
      </main>
    );
  }

  if (!supabaseConfigured) {
    return (
      <main
        className={`mx-auto w-full max-w-[min(96rem,100%)] px-3 pb-14 ${SELL_PAGE_TOP_PAD} text-zinc-100 sm:px-6 lg:px-10 lg:pb-16 [html[data-theme='light']_&]:text-zinc-900`}
      >
        <div className="mb-8 rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-sm">
          <h1 className="text-[clamp(1.25rem,3.5vw,1.6rem)] font-semibold tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
            {t("sell.demoTitle")}
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            {t("sell.demoDesc")}
          </p>
        </div>

        <SellerClipUploadForm />
      </main>
    );
  }

  if (!user) {
    return (
      <>
        <div
          className="min-h-screen bg-zinc-950 text-zinc-100 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
          aria-hidden
        />
        <SellRegistrationModal open onClose={leaveSellGate} />
      </>
    );
  }

  return (
    <main
      className={`mx-auto w-full max-w-[min(96rem,100%)] px-3 pb-16 ${SELL_PAGE_TOP_PAD} text-zinc-100 sm:px-6 lg:px-10 [html[data-theme='light']_&]:text-zinc-900`}
    >
      <SellerClipUploadForm />
    </main>
  );
}
