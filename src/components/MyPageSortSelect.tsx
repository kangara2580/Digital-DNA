"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type MyPageSortOption = { readonly value: string; readonly label: string };

const triggerClass =
  "flex min-w-[11.5rem] w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-white/15 bg-reels-void/80 px-3 py-2 text-left text-[13px] font-medium text-zinc-100 outline-none transition-[border-color,background-color] hover:border-white/45 hover:bg-white/[0.08] focus-visible:border-white/50 focus-visible:outline-none [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:border-zinc-400 [html[data-theme='light']_&]:focus-visible:border-zinc-500";

export function MyPageSortSelect({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: readonly MyPageSortOption[];
  value: string;
  onChange: (next: string) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnId = useId();
  const listId = useId();

  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative min-w-[11.5rem]" ref={wrapRef}>
      <button
        type="button"
        id={btnId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={triggerClass}
      >
        <span className="min-w-0 flex-1 truncate">{selected.label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform [html[data-theme='light']_&]:text-zinc-600 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={btnId}
          className="absolute left-0 top-full z-[100] mt-1 w-max min-w-full max-h-[min(22rem,calc(100vh-8rem))] overflow-y-auto overflow-x-hidden rounded-lg border border-white/12 bg-[#121214]/98 py-1 shadow-[0_14px_48px_-10px_rgba(0,0,0,0.85)] backdrop-blur-md [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-lg"
        >
          {options.map((o) => {
            const isSel = o.value === value;
            return (
              <li key={o.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSel}
                  className={`flex w-full min-w-[11.25rem] max-w-[20rem] items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--reels-point)]/40 [html[data-theme='light']_&]:focus-visible:ring-reels-crimson/35 ${
                    isSel
                      ? "bg-[color:var(--reels-point)]/16 font-semibold text-zinc-50 [html[data-theme='light']_&]:bg-reels-crimson/12 [html[data-theme='light']_&]:text-reels-crimson"
                      : "text-zinc-300 hover:bg-white/[0.06] hover:text-zinc-100 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-zinc-900"
                  }`}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
                    {isSel ? (
                      <Check className="h-3.5 w-3.5 text-[color:var(--reels-point)] [html[data-theme='light']_&]:text-reels-crimson" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1 leading-snug">{o.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
