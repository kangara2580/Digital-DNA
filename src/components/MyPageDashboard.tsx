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
import { MyPageReviewsSection } from "@/components/MyPageReviewsSection";
import { DocumentTitleI18n } from "@/components/DocumentTitleI18n";
import { MYPAGE_OUTLINE_BTN_SM } from "@/lib/mypageOutlineCta";
import {
  ACCOUNT_PAGE_ASIDE_CLASS,
  ACCOUNT_PAGE_CONTAINER_CLASS,
  ACCOUNT_PAGE_LAYOUT_CLASS,
  ACCOUNT_PAGE_HEADER_CLASS,
  ACCOUNT_PAGE_MAIN_CLASS,
  ACCOUNT_PAGE_MENU_LABEL_CLASS,
  ACCOUNT_PAGE_NAV_CLASS,
  ACCOUNT_PAGE_SECTION_CLASS,
  ACCOUNT_PAGE_TITLE_CLASS,
} from "@/lib/accountSidebarLayout";
import {
  sidebarNavLinkActiveClass,
  sidebarNavLinkInactiveClass,
} from "@/lib/brandPinkTokens";
import { GlobalLoading } from "@/components/GlobalLoading";
import { useTranslation } from "@/hooks/useTranslation";
import {
  MYPAGE_TAB_DEFS,
  normalizeMyPageTab,
  type MyPageTab,
} from "@/lib/mypageTabs";

const TAB_DEFS = MYPAGE_TAB_DEFS;

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

export function MyPageDashboard() {
  const params = useSearchParams();
  const { t } = useTranslation();
  const currentTab = normalizeMyPageTab(params.get("tab"));
  const activeDef = useMemo(
    () => TAB_DEFS.find((item) => item.id === currentTab) ?? TAB_DEFS[0],
    [currentTab],
  );
  const { loading: authLoading, user } = useAuthSession();

  return (
    <main className={ACCOUNT_PAGE_MAIN_CLASS}>
      <DocumentTitleI18n titleKey="meta.mypage" />
      <div className={ACCOUNT_PAGE_CONTAINER_CLASS}>
        <div className={ACCOUNT_PAGE_LAYOUT_CLASS}>
        <header className={ACCOUNT_PAGE_HEADER_CLASS}>
          <h1 className={ACCOUNT_PAGE_TITLE_CLASS}>
            {t("mypage.title")}
          </h1>
        </header>

          <aside className={ACCOUNT_PAGE_ASIDE_CLASS}>
            <p className={ACCOUNT_PAGE_MENU_LABEL_CLASS}>
              {t("mypage.menuLabel")}
            </p>
            <nav aria-label={t("mypage.navAria")} className={ACCOUNT_PAGE_NAV_CLASS}>
              {TAB_DEFS.map((item) => {
                const active = item.id === currentTab;
                const label = t(`mypage.tab.${item.id}`);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={active ? sidebarNavLinkActiveClass : sidebarNavLinkInactiveClass}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <section className={ACCOUNT_PAGE_SECTION_CLASS}>
            {authLoading && !user ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 [html[data-theme='light']_&]:border-zinc-100 [html[data-theme='light']_&]:bg-zinc-50/50">
                <GlobalLoading size="lg" label={t("common.loading")} />
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

            {currentTab === "reviews" && user ? (
              <MyPageSectionShell title={t("mypage.section.reviews.title")}>
                <MyPageReviewsSection />
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
