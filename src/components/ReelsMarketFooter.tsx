"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId } from "react";


function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M12 16a4 4 0 100-8 4 4 0 000 8z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M21.6 7.2c.2.8.3 1.7.3 2.6v4.4c0 2.8-.4 4.7-1.2 5.6-.7.8-2 1.2-3.9 1.2H7.2c-1.9 0-3.2-.4-3.9-1.2-.8-.9-1.2-2.8-1.2-5.6V9.8c0-2.8.4-4.7 1.2-5.6.7-.8 2-1.2 3.9-1.2h9.6c1.9 0 3.2.4 3.9 1.2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path fill="currentColor" d="M10 9.5v5l4.5-2.5L10 9.5z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

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
      className="relative z-0 mt-auto border-t border-white/10 bg-[#03060f]/92 backdrop-blur-md [html[data-theme='light']_&]:border-zinc-200/90 [html[data-theme='light']_&]:bg-white/95"
      aria-labelledby={`${baseId}-footer-title`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-reels-cyan/25 to-transparent" aria-hidden />

      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="mt-7 grid grid-cols-4 gap-4 sm:gap-6">
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/30 text-zinc-100 transition hover:border-white/60 hover:text-white [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-800"
              aria-label="Instagram"
            >
              <InstagramIcon className="h-[18px] w-[18px]" />
            </a>
            <a
              href="https://twitter.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/30 text-zinc-100 transition hover:border-white/60 hover:text-white [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-800"
              aria-label="X"
            >
              <XIcon className="h-[17px] w-[17px]" />
            </a>
            <a
              href="https://www.youtube.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/30 text-zinc-100 transition hover:border-white/60 hover:text-white [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-800"
              aria-label="YouTube"
            >
              <YoutubeIcon className="h-[18px] w-[18px]" />
            </a>
            <a
              href="https://www.tiktok.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/30 text-zinc-100 transition hover:border-white/60 hover:text-white [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-800"
              aria-label="TikTok"
            >
              <TikTokIcon className="h-[17px] w-[17px]" />
            </a>
          </div>

          <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2" aria-label="푸터 링크">
            <Link href="/about" className={footerLinkClass("/about")}>소개</Link>
            <Link href="/license" className={footerLinkClass("/license")}>라이선스 규정</Link>
            <Link href="/notice" className={footerLinkClass("/notice")}>공지</Link>
            <Link href="/contact" className={footerLinkClass("/contact")}>문의</Link>
            <Link href="/terms" className={footerLinkClass("/terms")}>이용약관</Link>
            <Link href="/privacy" className={footerLinkClass("/privacy")}>개인정보처리방침</Link>
            <Link href="/cookies" className={footerLinkClass("/cookies")}>쿠키 정책</Link>
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
