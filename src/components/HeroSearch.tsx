"use client";

import { useState } from "react";

export function HeroSearch() {
  const [q, setQ] = useState("");

  return (
    <header className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-2">
      <div className="text-center">
        <h1 className="text-balance bg-gradient-to-br from-violet-600 via-fuchsia-600 to-lime-500 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
          디지털 DNA
        </h1>
        <p className="mt-2 max-w-xl text-balance text-sm text-slate-600">
          직접 찍은 영상을 올리고, 판매하는{" "}
          <span className="font-medium text-slate-900">동영상 쇼핑몰</span>입니다.
        </p>
      </div>

      <div className="relative w-full max-w-2xl">
        <span
          className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2 text-slate-400"
          aria-hidden
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="판매 중인 릴스, 크리에이터 검색"
          className="h-14 w-full rounded-full border border-slate-200/70 bg-white/85 pl-14 pr-6 text-[15px] text-slate-900 shadow-[inset_0_1px_0_rgba(2,6,23,0.06)] outline-none ring-0 backdrop-blur-xl placeholder:text-slate-500 focus:border-violet-500/55 focus:bg-white/95 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.22)]"
          aria-label="검색"
        />
      </div>
    </header>
  );
}
