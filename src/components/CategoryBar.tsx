"use client";

import { useState } from "react";

const TAGS = [
  "BEST",
  "NEW",
  "SING&DANCE",
  "MEME",
  "BEAUTY",
  "COMEDY",
  "GAME",
] as const;

export function CategoryBar() {
  const [active, setActive] = useState<string>("BEST");

  return (
    <div className="border border-slate-200/80 bg-white px-5 py-6 shadow-sm sm:px-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold text-[#000000]">
          카테고리
        </h2>
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
          Filter
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActive(tag)}
            className={`px-3.5 py-1.5 text-[11px] font-medium tracking-wide transition-colors ${
              active === tag
                ? "bg-[#000000] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            >
              {tag}
            </button>
          ))}
        </div>
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          RANK
        </span>
      </div>
    </div>
  );
}
