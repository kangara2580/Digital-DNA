"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";

const linkClass =
  "block w-fit text-[13px] font-medium leading-relaxed text-zinc-400 transition-colors hover:text-reels-cyan [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:text-[#00a8b5]";

const headingClass =
  "mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-500";

const selectShell =
  "w-full rounded-lg border border-white/12 bg-black/30 px-2.5 py-2 text-[12px] font-semibold text-zinc-200 outline-none transition focus:border-reels-cyan/40 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900";

const LS_LANG = "reels-footer-lang";

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
  const [lang, setLang] = useState("ko");

  useEffect(() => {
    try {
      const l = window.localStorage.getItem(LS_LANG);
      if (l === "ko" || l === "en") setLang(l);
    } catch {
      /* noop */
    }
  }, []);

  const persistLang = useCallback((v: string) => {
    setLang(v);
    try {
      window.localStorage.setItem(LS_LANG, v);
    } catch {
      /* noop */
    }
  }, []);

  const year = new Date().getFullYear();

  return (
    <footer
      className="relative z-0 mt-auto border-t border-white/10 bg-[#03060f]/92 backdrop-blur-md [html[data-theme='light']_&]:border-zinc-200/90 [html[data-theme='light']_&]:bg-white/95"
      aria-labelledby={`${baseId}-footer-title`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-reels-cyan/25 to-transparent" aria-hidden />

      <div className="mx-auto max-w-[1800px] px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <div className="min-w-0 max-w-sm">
            <p id={`${baseId}-footer-title`} className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-reels-cyan/90">
              ARA
            </p>
            <p className="mt-2 text-[15px] font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
              모션을 사고, 순간을 소유하세요.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              크리에이터와 브랜드가 신뢰로 연결되는 릴스 클립 마켓.
            </p>
          </div>

          <nav
            className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-4 md:gap-10"
            aria-label="푸터 링크"
          >
            <div>
              <h2 className={headingClass}>Platform</h2>
              <ul className="flex flex-col gap-2">
                <li>
                  <Link href="/about" className={linkClass}>
                    회사소개 (Digital DNA)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/license"
                    className={`${linkClass} font-semibold text-reels-cyan/95 hover:text-reels-cyan`}
                  >
                    라이선스 규정
                  </Link>
                </li>
                <li>
                  <Link href="/notice" className={linkClass}>
                    공지사항
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className={headingClass}>Support</h2>
              <ul className="flex flex-col gap-2">
                <li>
                  <Link href="/faq" className={linkClass}>
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className={linkClass}>
                    1:1 문의
                  </Link>
                </li>
                <li>
                  <p className="text-[11px] leading-snug text-zinc-600 [html[data-theme='light']_&]:text-zinc-500">
                    광고·제휴·입점 문의는 1:1 문의에 남겨 주세요.
                  </p>
                </li>
                <li>
                  <Link href="/terms" className={linkClass}>
                    이용약관
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className={headingClass}>Legal</h2>
              <ul className="flex flex-col gap-2">
                <li>
                  <Link href="/privacy" className={linkClass}>
                    개인정보처리방침
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className={linkClass}>
                    쿠키 정책
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-1">
              <h2 className={headingClass}>Global</h2>
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 [html[data-theme='light']_&]:text-zinc-500">
                    언어
                  </span>
                  <select
                    name="language"
                    className={selectShell}
                    value={lang}
                    onChange={(e) => persistLang(e.target.value)}
                    aria-label="표시 언어"
                  >
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                  </select>
                </label>
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600 [html[data-theme='light']_&]:text-zinc-500">
                    SNS
                  </p>
                  <div className="grid w-full grid-cols-2 gap-2 min-[380px]:grid-cols-4 min-[380px]:gap-x-2 min-[380px]:gap-y-0 place-items-center">
                    <a
                      href="https://www.instagram.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-zinc-300 transition hover:border-reels-cyan/35 hover:text-reels-cyan [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-800"
                      aria-label="Instagram"
                    >
                      <InstagramIcon className="h-[18px] w-[18px]" />
                    </a>
                    <a
                      href="https://twitter.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-zinc-300 transition hover:border-reels-cyan/35 hover:text-reels-cyan [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-800"
                      aria-label="X"
                    >
                      <XIcon className="h-[17px] w-[17px]" />
                    </a>
                    <a
                      href="https://www.youtube.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-zinc-300 transition hover:border-reels-cyan/35 hover:text-reels-cyan [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-800"
                      aria-label="YouTube"
                    >
                      <YoutubeIcon className="h-[18px] w-[18px]" />
                    </a>
                    <a
                      href="https://www.tiktok.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-zinc-300 transition hover:border-reels-cyan/35 hover:text-reels-cyan [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-800"
                      aria-label="TikTok"
                    >
                      <TikTokIcon className="h-[17px] w-[17px]" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-8 [html[data-theme='light']_&]:border-zinc-200 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-zinc-600 [html[data-theme='light']_&]:text-zinc-500">
            © {year}{" "}
            <span className="font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">
              Digital DNA
            </span>
            . All rights reserved.
          </p>
          <p className="text-[11px] text-zinc-600 [html[data-theme='light']_&]:text-zinc-500">
            사업자·정산·분쟁 조항은 이용약관 및 라이선스 규정을 따릅니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
