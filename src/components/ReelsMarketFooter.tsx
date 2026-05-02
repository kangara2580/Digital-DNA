"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId } from "react";

export function ARAFooter() {
  const baseId = useId();
  const year = new Date().getFullYear();
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;
  const footerLinkClass = (href: string) =>
    `text-[13px] transition ${
      isActive(href)
        ? "font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
        : "font-medium text-zinc-400 hover:text-white [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:text-zinc-900"
    }`;

  return (
    <footer
      className="relative z-0 mt-auto border-t border-white/[0.22] bg-[color:var(--home-ranked-strip-bg)] [html[data-theme='light']_&]:border-zinc-200/90 [html[data-theme='light']_&]:bg-white/95 [html[data-theme='light']_&]:backdrop-blur-md"
      aria-labelledby={`${baseId}-footer-title`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.28] to-transparent [html[data-theme='light']_&]:via-zinc-300/60"
        aria-hidden
      />

      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <nav className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2" aria-label="푸터 링크">
            <Link href="/about" className={footerLinkClass("/about")}>소개</Link>
            <Link href="/license" className={footerLinkClass("/license")}>약관 및 정책</Link>
            <Link href="/notice" className={footerLinkClass("/notice")}>공지</Link>
            <Link href="/contact" className={footerLinkClass("/contact")}>고객센터</Link>
            <Link href="/privacy" className={footerLinkClass("/privacy")}>개인정보처리방침</Link>
          </nav>

          <div className="mt-8 w-full border-t border-white/10 pt-5 [html[data-theme='light']_&]:border-zinc-200">
            <p className="text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              © {year} <span className="font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">ARA</span>. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
