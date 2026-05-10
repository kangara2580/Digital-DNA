"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Store } from "lucide-react";
import { SellerClipUploadForm } from "@/components/SellerClipUploadForm";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTranslation } from "@/hooks/useTranslation";
import { MYPAGE_OUTLINE_BTN_MD } from "@/lib/mypageOutlineCta";

const REDIRECT = "/sell";

/** 플로팅 계정·장바구니(h-11, top≈1rem) 아래로 폼 테두리가 들어가도록 여유 */
const SELL_PAGE_TOP_PAD =
  "pt-[max(4.75rem,calc(env(safe-area-inset-top)+3.5rem))] sm:pt-[max(5.25rem,calc(env(safe-area-inset-top)+3.75rem))]";

export function SellPageClient() {
  const { t } = useTranslation();
  const { user, loading, supabaseConfigured } = useAuthSession();
  const searchParams = useSearchParams();
  const sourceParam = searchParams.get("source");
  const initialSourceType = sourceParam === "file" || sourceParam === "url" ? sourceParam : null;

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

        {initialSourceType ? (
          <SellerClipUploadForm initialSourceType={initialSourceType} />
        ) : (
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="mx-auto w-full max-w-[min(40rem,100%)] rounded-2xl border border-white/10 bg-zinc-900/50 p-8 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
              <p className="mb-6 text-[16px] font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                {t("sell.chooseMethod")}
              </p>
              <div className="mx-auto flex w-full max-w-[31rem] gap-1.5 rounded-[2.35rem] border border-white/[0.14] bg-white/[0.04] p-2.5 [html[data-theme='light']_&]:border-zinc-200/90 [html[data-theme='light']_&]:bg-zinc-100/60">
                <Link
                  href="/sell?source=file"
                  className="inline-flex min-h-[88px] flex-1 items-center justify-center rounded-[1.9rem] px-5 py-4 text-[22px] font-semibold leading-none text-zinc-100 transition-colors hover:bg-white/[0.08] [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:bg-white/80"
                >
                  {t("sell.methodFile")}
                </Link>
                <Link
                  href="/sell?source=url"
                  className="inline-flex min-h-[88px] flex-1 items-center justify-center rounded-[1.9rem] px-5 py-4 text-[22px] font-semibold leading-none text-zinc-100 transition-colors hover:bg-white/[0.08] [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:bg-white/80"
                >
                  {t("sell.methodUrl")}
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  if (!user) {
    return (
      <main
        className={`mx-auto max-w-[min(40rem,100%)] px-4 pb-14 ${SELL_PAGE_TOP_PAD} text-zinc-100 sm:px-6 [html[data-theme='light']_&]:text-zinc-900`}
      >
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-sm">
          <div className="flex items-center gap-2">
            <Store
              aria-hidden
              className="h-6 w-6 shrink-0"
              color="#E42980"
              strokeWidth={2}
            />
            <h1 className="text-[clamp(1.15rem,3.2vw,1.35rem)] font-semibold tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
              {t("sell.loginRequired")}
            </h1>
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            {t("sell.loginDesc")}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={`/login?redirect=${encodeURIComponent(REDIRECT)}`}
              className="inline-flex items-center justify-center rounded-xl bg-reels-crimson px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-market-bloomHover"
            >
              {t("sell.loginCta")}
            </Link>
            <Link
              href={`/signup?redirect=${encodeURIComponent(REDIRECT)}`}
              className={MYPAGE_OUTLINE_BTN_MD}
            >
              {t("sell.signupCta")}
            </Link>
          </div>
          <p className="mt-6 text-[12px] text-zinc-600 [html[data-theme='light']_&]:text-zinc-500">
            {t("sell.loginHint")}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`mx-auto w-full max-w-[min(96rem,100%)] px-3 pb-16 ${SELL_PAGE_TOP_PAD} text-zinc-100 sm:px-6 lg:px-10 [html[data-theme='light']_&]:text-zinc-900`}
    >
      {initialSourceType ? (
        <SellerClipUploadForm initialSourceType={initialSourceType} />
      ) : (
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="mx-auto w-full max-w-[min(40rem,100%)] rounded-2xl border border-white/10 bg-zinc-900/50 p-8 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
            <p className="mb-6 text-[16px] font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
              {t("sell.chooseMethod")}
            </p>
            <div className="mx-auto flex w-full max-w-[31rem] gap-1.5 rounded-[2.35rem] border border-white/[0.14] bg-white/[0.04] p-2.5 [html[data-theme='light']_&]:border-zinc-200/90 [html[data-theme='light']_&]:bg-zinc-100/60">
              <Link
                href="/sell?source=file"
                className="inline-flex min-h-[88px] flex-1 items-center justify-center rounded-[1.9rem] px-5 py-4 text-[22px] font-semibold leading-none text-zinc-100 transition-colors hover:bg-white/[0.08] [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:bg-white/80"
              >
                {t("sell.methodFile")}
              </Link>
              <Link
                href="/sell?source=url"
                className="inline-flex min-h-[88px] flex-1 items-center justify-center rounded-[1.9rem] px-5 py-4 text-[22px] font-semibold leading-none text-zinc-100 transition-colors hover:bg-white/[0.08] [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:bg-white/80"
              >
                {t("sell.methodUrl")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
