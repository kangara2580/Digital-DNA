"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ReelsSearchField } from "@/components/ReelsSearchField";

/**
 * 헤더 바 없이 로그인 버튼과 같이 화면에 고정되는 검색.
 * — 홈·탐색만 (쇼핑몰은 MallTopNav sticky 행, 순위 페이지는 제외)
 */
export function FloatingReelsSearch() {
  const pathname = usePathname();
  const [exploreWatch, setExploreWatch] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const sync = () => {
      setExploreWatch(
        typeof document !== "undefined" &&
          document.documentElement.dataset.exploreMode === "watch",
      );
    };
    sync();
    window.addEventListener("reels:explore-mode", sync);
    return () => window.removeEventListener("reels:explore-mode", sync);
  }, []);

  const isLeaderboard =
    pathname === "/leaderboard" || pathname.startsWith("/leaderboard/");
  const isHome = pathname === "/";
  const isExplore =
    pathname === "/explore" || pathname.startsWith("/explore/");
  const isShop =
    pathname === "/shop" ||
    pathname.startsWith("/shop/") ||
    pathname.startsWith("/category/");

  if (isLeaderboard || isShop) return null;
  if (!isHome && !isExplore) return null;

  if (isHome) {
    return (
      <div className="pointer-events-none fixed inset-y-0 right-0 left-0 z-[118] md:left-[var(--reels-rail-w)]">
        <div className="pointer-events-auto flex w-full items-center justify-end px-4 pt-4 pr-[max(1rem,env(safe-area-inset-right))] sm:px-6 sm:pt-5 sm:pr-[max(1.5rem,env(safe-area-inset-right))]">
          {/*
            검색–캡슐 간격 축소분만큼 필드 너비를 더해 왼쪽 끝은 유지하고 오른쪽만 캡슐 쪽으로 확장
          */}
          <div className="mr-[calc(1rem+6.875rem+0.125rem)] w-[min(15.625rem,calc(100vw-var(--reels-rail-w,0px)-9.375rem))] shrink-0 sm:mr-[calc(1.5rem+7rem+0.125rem)] sm:w-[min(17.125rem,calc(100vw-var(--reels-rail-w,0px)-10.375rem))]">
            <ReelsSearchField compact={false} topNavPill q={q} setQ={setQ} />
          </div>
        </div>
      </div>
    );
  }

  if (isExplore && exploreWatch) {
    return (
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[102] md:pl-[var(--reels-rail-w)]">
        <div className="pointer-events-auto flex justify-end pt-[max(0.65rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:pt-[max(0.75rem,env(safe-area-inset-top))] sm:pr-5">
          <div className="mr-[4.25rem] w-[min(15rem,calc(100vw-var(--reels-rail-w,0px)-8.5rem))] sm:mr-[5.25rem]">
            <ReelsSearchField compact q={q} setQ={setQ} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[118]">
      <div className="pointer-events-auto mx-auto max-w-[1800px] pl-4 pr-[calc(7.5rem+env(safe-area-inset-right))] pt-[max(0.65rem,env(safe-area-inset-top))] sm:pl-6 sm:pr-[calc(8rem+env(safe-area-inset-right))] sm:pt-[max(0.75rem,env(safe-area-inset-top))] md:pl-[calc(var(--reels-rail-w)+1rem)] lg:pl-8">
        <div className="w-full max-w-[15.5rem] sm:max-w-[17rem]">
          <ReelsSearchField compact q={q} setQ={setQ} />
        </div>
      </div>
    </div>
  );
}
