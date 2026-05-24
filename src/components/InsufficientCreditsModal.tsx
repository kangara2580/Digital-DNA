"use client";

import { useRouter } from "next/navigation";
import { formatGems } from "@/lib/gemPrice";

export function InsufficientCreditsModal({
  required,
  balance,
  onClose,
}: {
  required: number;
  balance: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const shortage = Math.max(0, required - balance);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
        <h2 className="text-xl font-black text-white [html[data-theme='light']_&]:text-zinc-900">
          보석이 부족합니다
        </h2>

        <div className="mt-4 space-y-2 text-sm text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
          <div className="flex justify-between">
            <span>필요한 보석</span>
            <span className="font-black text-white [html[data-theme='light']_&]:text-zinc-900">
              {formatGems(required)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>보유 보석</span>
            <span className="font-black text-amber-400">
              {formatGems(balance)}
            </span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-2 [html[data-theme='light']_&]:border-zinc-200">
            <span>부족한 보석</span>
            <span className="font-black text-rose-400">
              {formatGems(shortage)}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push("/assets");
            }}
            className="h-11 w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-black text-white shadow-lg transition hover:shadow-amber-500/30"
          >
            보석 충전하기
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-full rounded-full border border-white/20 text-sm font-bold text-zinc-400 transition hover:bg-white/5 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:text-zinc-600"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
