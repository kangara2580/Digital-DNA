"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  SELL_VIDEO_CATEGORY_USER_OPTIONS,
  type SellVideoUserSelectableCategory,
} from "@/lib/sellVideoCategory";

type Props = {
  id: string;
  listboxId: string;
  value: SellVideoUserSelectableCategory;
  onChange: (next: SellVideoUserSelectableCategory) => void;
  /** e.g. "판매 카테고리 선택" */
  ariaLabel?: string;
};

const OPTION_ROW =
  "flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-[14px] font-medium text-zinc-100 transition-colors hover:bg-white/[0.08] focus:bg-white/[0.08] focus:outline-none [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:focus:bg-zinc-100";

export function SellCategorySelect({
  id,
  listboxId,
  value,
  onChange,
  ariaLabel = "카테고리 선택",
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const currentLabel =
    SELL_VIDEO_CATEGORY_USER_OPTIONS.find((o) => o.value === value)?.label ?? value;

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: PointerEvent) => {
      const t = e.target;
      if (t instanceof Node && wrapRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointer, true);
    return () => document.removeEventListener("pointerdown", onDocPointer, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <div className="rounded-xl border border-white/[0.14] bg-[#0c0c0e] [html[data-theme='light']_&]:border-zinc-300/90 [html[data-theme='light']_&]:bg-white">
        <button
          ref={triggerRef}
          type="button"
          id={id}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          onClick={() => setOpen((o) => !o)}
          className={`flex min-h-[48px] w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left text-[15px] font-medium text-zinc-100 outline-none transition-colors [html[data-theme='light']_&]:text-zinc-900 ${
            open
              ? "rounded-t-xl border-b border-white/[0.1] [html[data-theme='light']_&]:border-zinc-200/90"
              : "rounded-xl"
          }`}
        >
          <span className="min-w-0 truncate">{currentLabel}</span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-200 [html[data-theme='light']_&]:text-zinc-600 ${
              open ? "-rotate-180" : ""
            }`}
            strokeWidth={2}
            aria-hidden
          />
        </button>

        {open ? (
          <ul
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            className="max-h-[min(18rem,50vh)] overflow-y-auto overflow-x-hidden rounded-b-xl py-1"
            aria-label={ariaLabel}
          >
            {SELL_VIDEO_CATEGORY_USER_OPTIONS.map((item) => {
              const selected = item.value === value;
              return (
                <li key={item.value} role="none" className="list-none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={OPTION_ROW}
                    onClick={() => {
                      onChange(item.value);
                      setOpen(false);
                      queueMicrotask(() => triggerRef.current?.focus());
                    }}
                  >
                    {selected ? (
                      <Check
                        className="h-4 w-4 shrink-0 text-[color:var(--reels-point)] [html[data-theme='light']_&]:text-[color:var(--reels-point)]"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                    ) : (
                      <span className="inline-block h-4 w-4 shrink-0" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
