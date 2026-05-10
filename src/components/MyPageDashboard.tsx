"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { MyPageAccountOverview } from "@/components/MyPageAccountOverview";
import { MyPageMyListingsSection } from "@/components/MyPageMyListingsSection";
import { MyPageSavedDraftsSection } from "@/components/MyPageSavedDraftsSection";
import { MyPageSectionShell } from "@/components/MyPageSectionShell";
import { MyPageSellerAnalyticsSection } from "@/components/MyPageSellerAnalyticsSection";
import { useAuthSession } from "@/hooks/useAuthSession";
import { MyPageWishlistSection } from "@/components/MyPageWishlistSection";
import { MyPageLikedVideosSection } from "@/components/MyPageLikedVideosSection";
import { DocumentTitleI18n } from "@/components/DocumentTitleI18n";
import { MYPAGE_OUTLINE_BTN_SM } from "@/lib/mypageOutlineCta";
import { useTranslation } from "@/hooks/useTranslation";

type MyPageTab = "drafts" | "analytics" | "listings" | "wishlist" | "likes" | "purchases";

const TAB_DEFS: { id: MyPageTab; href: string }[] = [
  { id: "wishlist", href: "/mypage?tab=wishlist" },
  { id: "likes", href: "/mypage?tab=likes" },
  { id: "purchases", href: "/mypage?tab=purchases" },
  { id: "drafts", href: "/mypage?tab=drafts" },
  { id: "listings", href: "/mypage?tab=listings" },
  { id: "analytics", href: "/mypage?tab=analytics" },
];

function LoginRequiredPanel({ tabId }: { tabId: MyPageTab }) {
  const { t } = useTranslation();
  const tabLabel = t(`mypage.tab.${tabId}`);
  const href = TAB_DEFS.find((x) => x.id === tabId)?.href ?? TAB_DEFS[0].href;
  const redirect = encodeURIComponent(href);

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-sm">
      <h2 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-[1.375rem] [html[data-theme='light']_&]:text-zinc-900">
        {tabLabel}
      </h2>
      <div className="mt-8 rounded-xl border border-dashed border-white/15 bg-black/25 p-8 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50/80">
        <p className="text-[16px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          {t("mypage.loginGate", { tab: tabLabel })}
        </p>
        <Link href={`/login?redirect=${redirect}`} className={`mt-5 ${MYPAGE_OUTLINE_BTN_SM}`}>
          {t("mypage.loginCta")}
        </Link>
      </div>
    </div>
  );
}

function normalizeTab(input: string | null): MyPageTab {
  if (input === "saved") return "wishlist";
  if (
    input === "drafts" ||
    input === "analytics" ||
    input === "listings" ||
    input === "wishlist" ||
    input === "likes" ||
    input === "purchases"
  ) {
    return input;
  }
  return "wishlist";
}

export function MyPageDashboard() {
  const params = useSearchParams();
  const { t } = useTranslation();
  const currentTab = normalizeTab(params.get("tab"));
  const activeDef = useMemo(
    () => TAB_DEFS.find((item) => item.id === currentTab) ?? TAB_DEFS[0],
    [currentTab],
  );
  const { loading: authLoading, user } = useAuthSession();

  return (
    <main className="min-h-[60vh] bg-zinc-950 text-zinc-100 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900">
      <DocumentTitleI18n titleKey="meta.mypage" />
      <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 sm:py-12 lg:px-10">
        <header className="border-b border-white/10 pb-8 [html[data-theme='light']_&]:border-zinc-100">
          <h1 className="text-[1.625rem] font-semibold tracking-tight text-zinc-50 sm:text-[1.875rem] [html[data-theme='light']_&]:text-zinc-900">
            {t("mypage.title")}
          </h1>
        </header>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,13.5rem)_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 text-[13px] font-medium uppercase tracking-[0.12em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-400">
              {t("mypage.menuLabel")}
            </p>
            <nav aria-label={t("mypage.navAria")} className="flex flex-col gap-0.5">
              {TAB_DEFS.map((item) => {
                const active = item.id === currentTab;
                const label = t(`mypage.tab.${item.id}`);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={
                      active
                        ? "rounded-lg border-l-[3px] border-l-[#E42980] bg-white/[0.06] py-2.5 pl-[13px] pr-3 text-[16px] font-semibold text-zinc-50 transition-colors [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-900"
                        : "rounded-lg border-l-[3px] border-l-transparent py-2.5 pl-[13px] pr-3 text-[16px] font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-100 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:bg-zinc-50 [html[data-theme='light']_&]:hover:text-zinc-900"
                    }
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <section className="min-w-0">
            {authLoading && !user ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center [html[data-theme='light']_&]:border-zinc-100 [html[data-theme='light']_&]:bg-zinc-50/50">
                <p className="text-[16px] font-medium text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
                  {t("common.loading")}
                </p>
              </div>
            ) : null}
            {!authLoading && !user ? <LoginRequiredPanel tabId={activeDef.id} /> : null}

            {currentTab === "wishlist" && user ? (
              <MyPageSectionShell title={t("mypage.section.wishlist.title")}>
                <MyPageWishlistSection />
              </MyPageSectionShell>
            ) : null}

            {currentTab === "likes" && user ? (
              <MyPageSectionShell title={t("mypage.section.likes.title")}>
                <MyPageLikedVideosSection />
              </MyPageSectionShell>
            ) : null}

            {currentTab === "purchases" && user ? (
              <MyPageSectionShell title={t("mypage.section.purchases.title")}>
                <MyPageAccountOverview />
              </MyPageSectionShell>
            ) : null}

            {currentTab === "drafts" && user ? (
              <MyPageSectionShell title={t("mypage.section.drafts.title")}>
                <MyPageSavedDraftsSection />
              </MyPageSectionShell>
            ) : null}

            {currentTab === "listings" && user ? (
              <MyPageSectionShell title={t("mypage.section.listings.title")}>
                <MyPageMyListingsSection />
              </MyPageSectionShell>
            ) : null}

            {currentTab === "analytics" && user ? (
              <MyPageSectionShell title={t("mypage.section.analytics.title")}>
                <MyPageSellerAnalyticsSection />
              </MyPageSectionShell>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
