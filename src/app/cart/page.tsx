"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useDopamineBasket } from "@/context/DopamineBasketContext";

export default function CartPage() {
  const { builderItems, removeBuilderItem, clearBuilder } = useDopamineBasket();

  const totalWon = useMemo(
    () =>
      builderItems.reduce((sum, { video }) => sum + (video.priceWon ?? 0), 0),
    [builderItems],
  );

  return (
    <main className="mx-auto min-h-[50vh] max-w-2xl px-4 py-10 text-zinc-100 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100">
            장바구니
          </h1>
          <p className="mt-1 text-[15px] text-zinc-500">
            카드·상세에서 담은 조각이 여기와 하단 DNA 조합기에 같이 반영됩니다.
          </p>
        </div>
        {builderItems.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              if (
                typeof window !== "undefined" &&
                window.confirm("장바구니와 타임라인에서 모두 빼시겠어요?")
              ) {
                clearBuilder();
              }
            }}
            className="shrink-0 self-start rounded-lg border border-white/15 px-3 py-2 text-[13px] font-medium text-zinc-400 transition-colors hover:border-reels-cyan/35 hover:bg-white/[0.06] hover:text-zinc-100 sm:self-auto"
          >
            전체 비우기
          </button>
        ) : null}
      </header>

      {builderItems.length === 0 ? (
        <div className="mx-auto mt-14 max-w-sm text-center">
          <p className="text-[15px] font-semibold text-zinc-200">
            담긴 조각이 없어요
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">
            영상 카드에 마우스를 올린 뒤 장바구니 아이콘을 누르면 여기에
            쌓입니다.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-reels-crimson px-5 py-2.5 text-[14px] font-extrabold text-white shadow-reels-crimson hover:brightness-110"
          >
            클립 둘러보기
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 divide-y divide-white/10">
            {builderItems.map(({ key, video }) => (
              <li
                key={key}
                className="flex gap-4 py-4 first:pt-0 sm:gap-5 sm:py-5"
              >
                <Link
                  href={`/video/${video.id}`}
                  className="relative h-[88px] w-[66px] shrink-0 overflow-hidden rounded-lg border border-white/12 bg-black/40 sm:h-[100px] sm:w-[75px]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={video.poster}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/video/${video.id}`}
                    className="line-clamp-2 text-left text-[15px] font-bold leading-snug text-zinc-100 hover:text-reels-cyan"
                  >
                    {video.title}
                  </Link>
                  <p className="mt-1 truncate text-[13px] text-zinc-500">
                    {video.creator}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {video.priceWon != null ? (
                      <span className="text-[15px] font-extrabold tabular-nums text-reels-cyan">
                        {video.priceWon.toLocaleString("ko-KR")}원
                      </span>
                    ) : (
                      <span className="text-[14px] text-zinc-500">가격 문의</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeBuilderItem(key)}
                      className="rounded-md px-2 py-1 text-[12px] font-medium text-zinc-500 underline-offset-2 hover:bg-white/10 hover:text-zinc-200"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <footer className="mt-8 border-t border-white/10 pt-6">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[15px] font-medium text-zinc-400">
                합계
              </span>
              <span className="text-xl font-extrabold tabular-nums text-zinc-100">
                {totalWon.toLocaleString("ko-KR")}원
              </span>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-zinc-600">
              결제 연동 전 데모 화면입니다. 하단 DNA 조합기에서 순서를 바꿔
              이어 붙여 볼 수 있어요.
            </p>
            <button
              type="button"
              disabled
              className="mt-6 w-full rounded-full border border-white/15 bg-white/[0.06] py-3.5 text-[15px] font-bold text-zinc-500 opacity-90"
            >
              결제 진행 (준비 중)
            </button>
          </footer>
        </>
      )}
    </main>
  );
}
