"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { MyPageMyListingsSection } from "@/components/MyPageMyListingsSection";
import { MyPageSavedDraftsSection } from "@/components/MyPageSavedDraftsSection";
import { MyPageSellerAnalyticsSection } from "@/components/MyPageSellerAnalyticsSection";
import { useAuthSession } from "@/hooks/useAuthSession";
import { MyPageWishlistSection } from "@/components/MyPageWishlistSection";
import { MyPageLikedVideosSection } from "@/components/MyPageLikedVideosSection";

type MyPageTab =
  | "drafts"
  | "analytics"
  | "listings"
  | "wishlist"
  | "likes";

const TAB_ITEMS: { id: MyPageTab; label: string; href: string }[] = [
  { id: "listings", label: "내 등록 영상", href: "/mypage?tab=listings" },
  { id: "wishlist", label: "찜 목록", href: "/mypage?tab=wishlist" },
  { id: "likes", label: "좋아요한 동영상", href: "/mypage?tab=likes" },
  { id: "analytics", label: "판매 분석", href: "/mypage?tab=analytics" },
  { id: "drafts", label: "임시 저장", href: "/mypage?tab=drafts" },
];

function LoginRequiredPanel({
  tab,
}: {
  tab: { id: MyPageTab; label: string; href: string };
}) {
  const redirect = encodeURIComponent(tab.href);

  return (
    <div className="reels-glass-card rounded-xl p-4 sm:rounded-2xl sm:p-5 lg:p-6">
      <h2 className="text-lg font-extrabold tracking-tight sm:text-xl">{tab.label}</h2>
      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-8 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
        <p className="text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          로그인하면 {tab.label} 탭을 포함한 마이페이지 기능을 모두 이용할 수 있어요.
        </p>
        <Link
          href={`/login?redirect=${redirect}`}
          className="mt-4 inline-flex rounded-full bg-reels-crimson px-5 py-2.5 text-[14px] font-extrabold text-white shadow-reels-crimson hover:brightness-110"
        >
          로그인
        </Link>
      </div>
    </div>
  );
}

function normalizeTab(input: string | null): MyPageTab {
  if (input === "saved") return "wishlist";
  if (
    input === "drafts" ||
    input === "analytics" ||
    input === "listings" ||
    input === "wishlist" ||
    input === "likes"
  ) {
    return input;
  }
  return "listings";
}

export function MyPageDashboard() {
  const params = useSearchParams();
  const currentTab = normalizeTab(params.get("tab"));
  const activeTab = useMemo(
    () => TAB_ITEMS.find((item) => item.id === currentTab) ?? TAB_ITEMS[0],
    [currentTab],
  );
  const { loading: authLoading, user } = useAuthSession();

  return (
    <main className="mx-auto min-h-[60vh] max-w-[1500px] px-3 py-8 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:px-5 sm:py-10 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl [html[data-theme='light']_&]:text-zinc-900">마이페이지</h1>
        </div>
      </div>

      {/* 작은 화면에서도 사이드바는 왼쪽 고정 너비, 본문만 유연하게 — 메뉴가 가로로 과하게 늘어나지 않음 */}
      <div className="mt-4 grid items-start gap-2 sm:mt-6 sm:gap-3 lg:gap-5 [grid-template-columns:minmax(10.5rem,12.5rem)_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="reels-glass-card w-full min-w-0 max-w-[12.5rem] justify-self-start rounded-xl p-2 sm:max-w-none sm:rounded-2xl sm:p-3 lg:sticky lg:top-20 lg:h-fit lg:max-w-none lg:p-4">
          <nav aria-label="마이페이지 메뉴" className="space-y-1 sm:space-y-1.5">
            {TAB_ITEMS.map((item) => {
              const active = item.id === currentTab;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`block rounded-lg border px-2 py-2 transition sm:rounded-xl sm:px-3 sm:py-2.5 ${
                    active
                      ? "border-reels-cyan/45 bg-reels-cyan/15 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
                      : "border-white/10 bg-black/20 text-zinc-400 hover:border-white/20 hover:text-zinc-200 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:text-zinc-900"
                  }`}
                >
                  <p className="text-[12px] font-bold leading-snug sm:text-[13px]">{item.label}</p>
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">
          {authLoading && !user ? (
            <div className="reels-glass-card rounded-xl p-10 text-center sm:rounded-2xl">
              <p className="text-[14px] font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                불러오는 중…
              </p>
            </div>
          ) : null}
          {!authLoading && !user ? <LoginRequiredPanel tab={activeTab} /> : null}

          {currentTab === "drafts" && user ? <MyPageSavedDraftsSection /> : null}

          {currentTab === "wishlist" && user ? <MyPageWishlistSection /> : null}
          {currentTab === "likes" && user ? <MyPageLikedVideosSection /> : null}

          {currentTab === "analytics" && user ? <MyPageSellerAnalyticsSection /> : null}

          {currentTab === "listings" && user ? (
            <div className="reels-glass-card rounded-xl p-4 sm:rounded-2xl sm:p-5 lg:p-6">
              <h2 className="text-lg font-extrabold tracking-tight sm:text-xl">
                내가 등록한 영상
              </h2>
              <div className="mt-6">
                <MyPageMyListingsSection />
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
