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
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">{tab.label}</h2>
      <div className="mt-8 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 p-8 text-center">
        <p className="text-[14px] leading-relaxed text-zinc-600">
          로그인하면 {tab.label} 탭을 포함한 마이페이지 기능을 모두 이용할 수 있어요.
        </p>
        <Link
          href={`/login?redirect=${redirect}`}
          className="mt-5 inline-flex rounded-full bg-reels-crimson px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_6px_20px_-6px_rgba(252,3,165,0.45)] transition hover:brightness-[1.05]"
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
    <main className="min-h-[60vh] bg-white text-zinc-900">
      <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 sm:py-12 lg:px-10">
        <header className="border-b border-zinc-100 pb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[1.75rem]">마이페이지</h1>
        </header>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,13.5rem)_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">메뉴</p>
            <nav aria-label="마이페이지 메뉴" className="flex flex-col gap-0.5">
              {TAB_ITEMS.map((item) => {
                const active = item.id === currentTab;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={
                      active
                        ? "rounded-lg border-l-[3px] border-l-[#fc03a5] bg-zinc-50 py-2.5 pl-[13px] pr-3 text-[14px] font-semibold text-zinc-900 transition-colors"
                        : "rounded-lg border-l-[3px] border-l-transparent py-2.5 pl-[13px] pr-3 text-[14px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <section className="min-w-0">
          {authLoading && !user ? (
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-12 text-center">
              <p className="text-[14px] font-medium text-zinc-500">불러오는 중…</p>
            </div>
          ) : null}
          {!authLoading && !user ? <LoginRequiredPanel tab={activeTab} /> : null}

          {currentTab === "drafts" && user ? <MyPageSavedDraftsSection /> : null}

          {currentTab === "wishlist" && user ? <MyPageWishlistSection /> : null}
          {currentTab === "likes" && user ? <MyPageLikedVideosSection /> : null}

          {currentTab === "analytics" && user ? <MyPageSellerAnalyticsSection /> : null}

          {currentTab === "listings" && user ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900">내가 등록한 영상</h2>
              <div className="mt-8">
                <MyPageMyListingsSection />
              </div>
            </div>
          ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
