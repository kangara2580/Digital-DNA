"use client";

import { useCallback, useRef, useState } from "react";

type Props = {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
};

export function ReviewBeforeAfter({
  beforeSrc,
  afterSrc,
  beforeLabel = "Before",
  afterLabel = "After · Reskin",
}: Props) {
  const [pct, setPct] = useState(52);
  const dragging = useRef(false);

  const onMove = useCallback(
    (clientX: number, rect: DOMRect) => {
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      setPct(Math.round((x / rect.width) * 100));
    },
    [],
  );

  return (
    <div
      className="relative mt-4 aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-black/40"
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        const rect = e.currentTarget.getBoundingClientRect();
        onMove(e.clientX, rect);
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        onMove(e.clientX, rect);
      }}
      onPointerUp={(e) => {
        dragging.current = false;
        try {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }}
      role="slider"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="리스킨 전후 비교"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={afterSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pct}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeSrc}
          alt=""
          className="absolute left-0 top-0 h-full object-cover"
          style={{ width: `${(100 / Math.max(pct, 6)) * 100}%`, maxWidth: "none" }}
        />
      </div>
      <div
        className="absolute bottom-0 top-0 w-0.5 bg-gradient-to-b from-reels-cyan to-reels-crimson shadow-reels-cyan"
        style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
      />
      <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/65 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-300">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute right-2 top-2 rounded bg-black/65 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-reels-cyan">
        {afterLabel}
      </span>
    </div>
  );
}
