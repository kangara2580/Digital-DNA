"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "@/hooks/useTranslation";

type Props = {
  title: string;
  description?: string;
  children?: ReactNode;
  /** false면 유리 카드 없이 children만 (회사소개 등 풀폭 본문) */
  withCard?: boolean;
  /** main 영역 max-width Tailwind 클래스 */
  mainMaxClass?: string;
  /** withCard=false일 때 children 래퍼 여백 클래스 */
  contentTopClass?: string;
  showBreadcrumb?: boolean;
  showTitle?: boolean;
  homeLinkTopClass?: string;
};

export function FooterLegalPageShell({
  title,
  description,
  children,
  withCard = true,
  mainMaxClass = "max-w-3xl",
  contentTopClass = "mt-10",
  showBreadcrumb = true,
  showTitle = true,
  homeLinkTopClass = "mt-8",
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="min-h-[60vh] text-[var(--foreground,#fafafa)] [html[data-theme='light']_&]:bg-white [html[data-theme='dark']_&]:bg-transparent">
      <main className={`mx-auto ${mainMaxClass} px-4 py-14 sm:px-6 sm:py-16`}>
        {showBreadcrumb ? (
          <nav
            aria-label="Breadcrumb"
            className="mb-8 font-mono text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600"
          >
            <ol className="flex items-center">
              <li>
                <Link
                  href="/"
                  className="font-bold text-zinc-100 transition hover:text-white [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:text-zinc-950"
                >
                  {t("legal.shell.home")}
                </Link>
              </li>
              <li
                aria-hidden
                className="mx-1.5 text-zinc-700 [html[data-theme='light']_&]:text-zinc-500"
              >
                /
              </li>
              <li className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">{title}</li>
            </ol>
          </nav>
        ) : null}
        {showTitle ? (
          <h1 className="text-2xl font-extrabold tracking-tight [html[data-theme='light']_&]:text-zinc-900 sm:text-3xl">
            {title}
          </h1>
        ) : null}
        {showTitle && description ? (
          <p className="mt-3 text-[14px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {description}
          </p>
        ) : null}
        {withCard ? (
          <div className="reels-glass-card mt-8 rounded-2xl p-6 sm:p-8">
            {children ?? (
              <p className="text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                {t("legal.shell.cardPlaceholder")}
              </p>
            )}
          </div>
        ) : children ? (
          <div className={contentTopClass}>{children}</div>
        ) : null}
        <p
          className={`${homeLinkTopClass} text-center text-[12px] text-zinc-600 [html[data-theme='light']_&]:text-zinc-500`}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-semibold text-white transition hover:opacity-90 [html[data-theme='light']_&]:text-zinc-900"
            aria-label={t("legal.shell.backHomeAria")}
          >
            <Home className="h-6 w-6" aria-hidden />
          </Link>
        </p>
      </main>
    </div>
  );
}
