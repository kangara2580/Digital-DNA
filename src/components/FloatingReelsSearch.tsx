"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ReelsSearchField } from "@/components/ReelsSearchField";

/**
 * 헤더 바 없이 고정되는 검색.
 * — 홈(/)은 Highlight24 히어로에 포함, 여기서는 탐색 등만.
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

  /* 홈: 검색은 Highlight24 히어로 안에서만 노출 */
  if (isHome) return null;

  if (isExplore && exploreWatch) {
    return (
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[102] md:pl-[var(--reels-rail-w)]">
        <div className="pointer-events-none flex justify-end pt-[max(0.65rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:pt-[max(0.75rem,env(safe-area-inset-top))] sm:pr-5">
          <div className="pointer-events-auto mr-[4.25rem] w-[min(15rem,calc(100vw-var(--reels-rail-w,0px)-8.5rem))] shrink-0 sm:mr-[5.25rem]">
            <ReelsSearchField compact q={q} setQ={setQ} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[118]">
      <div className="pointer-events-none mx-auto max-w-[1800px] pl-4 pr-[calc(7.5rem+env(safe-area-inset-right))] pt-[max(0.65rem,env(safe-area-inset-top))] sm:pl-6 sm:pr-[calc(8rem+env(safe-area-inset-right))] sm:pt-[max(0.75rem,env(safe-area-inset-top))] md:pl-[calc(var(--reels-rail-w)+1rem)] lg:pl-8">
        <div className="pointer-events-auto w-full max-w-[15.5rem] sm:max-w-[17rem]">
          <ReelsSearchField compact q={q} setQ={setQ} />
        </div>
      </div>
    </div>
  );
}
