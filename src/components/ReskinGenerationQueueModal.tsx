"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  /** 데모: 몇 ms 후 자동 닫힘 (실서비스는 WebSocket/SSE로 교체) */
  demoCloseMs?: number;
  onClose: () => void;
};

export function ReskinGenerationQueueModal({
  open,
  demoCloseMs = 8000,
  onClose,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => onClose(), demoCloseMs);
    return () => window.clearTimeout(id);
  }, [open, demoCloseMs, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/72 px-4 backdrop-blur-md"
      role="alertdialog"
      aria-live="assertive"
      aria-modal="true"
      aria-labelledby="reskin-queue-title"
      aria-describedby="reskin-queue-desc"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/12 bg-reels-void/95 p-6 shadow-[0_24px_80px_-20px_rgba(0,242,234,0.15)]">
        <p
          id="reskin-queue-title"
          className="text-center text-lg font-extrabold tracking-tight text-zinc-100"
        >
          영상을 제작 중입니다
        </p>
        <p
          id="reskin-queue-desc"
          className="mt-2 text-center text-[14px] leading-relaxed text-zinc-400"
        >
          약 1분 소요될 수 있어요. 잠시만 기다려 주세요.
        </p>
        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div className="reels-progress-bar h-full w-1/3 rounded-full bg-gradient-to-r from-reels-crimson via-reels-cyan to-reels-crimson" />
        </div>
        <p className="mt-4 text-center font-mono text-[10px] text-zinc-600">
          데모: {Math.round(demoCloseMs / 1000)}초 후 자동으로 닫힙니다
        </p>
      </div>
    </div>,
    document.body,
  );
}
