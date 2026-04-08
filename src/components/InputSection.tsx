"use client";

import { forwardRef } from "react";

type InputSectionProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
};

export const InputSection = forwardRef<HTMLTextAreaElement, InputSectionProps>(
  function InputSection(
    { value, onChange, placeholder, rows = 3, className },
    ref,
  ) {
    return (
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={
          className ??
          "mt-3 w-full resize-none rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:border-reels-cyan/45 focus:outline-none focus:ring-1 focus:ring-reels-cyan/30"
        }
      />
    );
  },
);
