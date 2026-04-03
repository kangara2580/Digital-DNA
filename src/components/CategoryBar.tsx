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
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActive(tag)}
            className={`rounded-full px-3 py-1 text-[10px] font-medium tracking-wide transition-colors ${
              active === tag
                ? "bg-violet-600 text-white shadow-[0_10px_30px_-18px_rgba(109,40,217,0.6)]"
                : "bg-violet-50 text-violet-700 hover:bg-lime-200/50 hover:text-violet-900"
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
  );
}
