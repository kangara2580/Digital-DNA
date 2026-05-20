"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTranslation } from "@/hooks/useTranslation";
import { MYPAGE_OUTLINE_BTN_SM } from "@/lib/mypageOutlineCta";
import { ASSETS_CREDIT_PAYMENT, ASSETS_SETTLEMENT } from "@/lib/assetsPaths";
import {
  ACCOUNT_PAGE_ASIDE_CLASS,
  ACCOUNT_PAGE_CONTAINER_CLASS,
  ACCOUNT_PAGE_LAYOUT_CLASS,
  ACCOUNT_PAGE_HEADER_CLASS,
  ACCOUNT_PAGE_MAIN_CLASS,
  ACCOUNT_PAGE_MENU_LABEL_CLASS,
  ACCOUNT_PAGE_SECTION_CLASS,
  ACCOUNT_PAGE_TITLE_CLASS,
} from "@/lib/accountSidebarLayout";
import {
  sidebarNavLinkActiveClass,
  sidebarNavLinkInactiveClass,
} from "@/lib/brandPinkTokens";

type Props = { children: ReactNode };

export function AssetsLayoutClient({ children }: Props) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { loading: authLoading, user } = useAuthSession();

  const onCredit = pathname === ASSETS_CREDIT_PAYMENT || pathname === `${ASSETS_CREDIT_PAYMENT}/`;
  const onSettlement = pathname === ASSETS_SETTLEMENT || pathname === `${ASSETS_SETTLEMENT}/`;

  const sectionLead = onSettlement ? t("assets.nav.settlement") : t("assets.nav.creditPayment");
  const redirectLogin = encodeURIComponent(pathname || ASSETS_CREDIT_PAYMENT);

  return (
    <main className={ACCOUNT_PAGE_MAIN_CLASS}>
      <div className={ACCOUNT_PAGE_CONTAINER_CLASS}>
        <div className={ACCOUNT_PAGE_LAYOUT_CLASS}>
        <header className={ACCOUNT_PAGE_HEADER_CLASS}>
          <h1 className={ACCOUNT_PAGE_TITLE_CLASS}>
            {t("assets.title")}
          </h1>
          <p className="mt-2 text-[15px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {sectionLead}
          </p>
        </header>

          <aside className={ACCOUNT_PAGE_ASIDE_CLASS}>
            <p className={ACCOUNT_PAGE_MENU_LABEL_CLASS}>
              {t("assets.menuLabel")}
            </p>
            <nav aria-label={t("assets.navAria")} className="flex flex-col gap-1">
              <Link
                href={ASSETS_CREDIT_PAYMENT}
                className={onCredit ? sidebarNavLinkActiveClass : sidebarNavLinkInactiveClass}
                aria-current={onCredit ? "page" : undefined}
              >
                {t("assets.nav.creditPayment")}
              </Link>
              <Link
                href={ASSETS_SETTLEMENT}
                className={onSettlement ? sidebarNavLinkActiveClass : sidebarNavLinkInactiveClass}
                aria-current={onSettlement ? "page" : undefined}
              >
                {t("assets.nav.settlement")}
              </Link>
            </nav>
          </aside>

          <section className={`${ACCOUNT_PAGE_SECTION_CLASS} space-y-10`}>
            {authLoading && !user ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center [html[data-theme='light']_&]:border-zinc-100 [html[data-theme='light']_&]:bg-zinc-50/50">
                <p className="text-[16px] font-medium text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
                  {t("common.loading")}
                </p>
              </div>
            ) : null}

            {!authLoading && !user ? (
              <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-sm">
                <h2 className="text-xl font-semibold tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
                  {t("assets.title")}
                </h2>
                <div className="mt-8 rounded-xl border border-dashed border-white/15 bg-black/25 p-8 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50/80">
                  <p className="text-[16px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                    {t("assets.loginGate")}
                  </p>
                  <Link href={`/login?redirect=${redirectLogin}`} className={`mt-5 ${MYPAGE_OUTLINE_BTN_SM}`}>
                    {t("assets.loginCta")}
                  </Link>
                </div>
              </div>
            ) : null}

            {user ? children : null}
          </section>
        </div>
      </div>
    </main>
  );
}
