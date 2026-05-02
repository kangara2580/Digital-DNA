"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { MyPageMyListingsSection } from "@/components/MyPageMyListingsSection";
import { MyPageSavedDraftsSection } from "@/components/MyPageSavedDraftsSection";
import { MyPageSectionShell } from "@/components/MyPageSectionShell";
import { MyPageSellerAnalyticsSection } from "@/components/MyPageSellerAnalyticsSection";
import { useAuthSession } from "@/hooks/useAuthSession";
import { MyPageWishlistSection } from "@/components/MyPageWishlistSection";
import { MyPageLikedVideosSection } from "@/components/MyPageLikedVideosSection";
import { MYPAGE_OUTLINE_BTN_SM } from "@/lib/mypageOutlineCta";

type MyPageTab =
  | "drafts"
  | "analytics"
  | "listings"
  | "wishlist"
  | "likes";

const TAB_ITEMS: { id: MyPageTab; label: string; href: string }[] = [
  { id: "wishlist", label: "찜 목록", href: "/mypage?tab=wishlist" },
  { id: "likes", label: "좋아요한 동영상", href: "/mypage?tab=likes" },
  { id: "drafts", label: "임시 저장", href: "/mypage?tab=drafts" },
  { id: "listings", label: "내 영상관리", href: "/mypage?tab=listings" },
  { id: "analytics", label: "판매 분석", href: "/mypage?tab=analytics" },
];

function LoginRequiredPanel({
  tab,
}: {
  tab: { id: MyPageTab; label: string; href: string };
}) {
  const redirect = encodeURIComponent(tab.href);

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl [html[data-theme='light']_&]:text-zinc-900">
        {tab.label}
      </h2>
      <div className="mt-8 rounded-xl border border-dashed border-white/15 bg-black/25 p-8 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50/80">
        <p className="text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          로그인하면 {tab.label} 탭을 포함한 마이페이지 기능을 모두 이용할 수 있어요.
        </p>
        <Link href={`/login?redirect=${redirect}`} className={`mt-5 ${MYPAGE_OUTLINE_BTN_SM}`}>
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
  return "wishlist";
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
    <main className="min-h-[60vh] bg-zinc-950 text-zinc-100 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900">
      <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 sm:py-12 lg:px-10">
        <header className="border-b border-white/10 pb-8 [html[data-theme='light']_&]:border-zinc-100">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-[1.75rem] [html[data-theme='light']_&]:text-zinc-900">
            마이페이지
          </h1>
        </header>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,13.5rem)_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-400">
              메뉴
            </p>
            <nav aria-label="마이페이지 메뉴" className="flex flex-col gap-0.5">
              {TAB_ITEMS.map((item) => {
                const active = item.id === currentTab;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={
                      active
                        ? "rounded-lg border-l-[3px] border-l-[#fc03a5] bg-white/[0.06] py-2.5 pl-[13px] pr-3 text-[14px] font-semibold text-zinc-50 transition-colors [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-900"
                        : "rounded-lg border-l-[3px] border-l-transparent py-2.5 pl-[13px] pr-3 text-[14px] font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-100 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:bg-zinc-50 [html[data-theme='light']_&]:hover:text-zinc-900"
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
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center [html[data-theme='light']_&]:border-zinc-100 [html[data-theme='light']_&]:bg-zinc-50/50">
              <p className="text-[14px] font-medium text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
                불러오는 중…
              </p>
            </div>
          ) : null}
          {!authLoading && !user ? <LoginRequiredPanel tab={activeTab} /> : null}

          {currentTab === "wishlist" && user ? (
            <MyPageSectionShell
              title="찜 목록"
              description="저장해 둔 릴스를 정리하고 바로 재생할 수 있어요."
            >
              <MyPageWishlistSection />
            </MyPageSectionShell>
          ) : null}

          {currentTab === "likes" && user ? (
            <MyPageSectionShell
              title="좋아요한 동영상"
              description="하트를 눌러 마음에 든 릴스만 따로 모아볼 수 있어요."
            >
              <MyPageLikedVideosSection />
            </MyPageSectionShell>
          ) : null}

          {currentTab === "drafts" && user ? (
            <MyPageSectionShell
              title="임시 저장"
              description="커스터마이즈 중 임시 저장한 편집을 이어서 열거나 삭제할 수 있어요."
            >
              <MyPageSavedDraftsSection />
            </MyPageSectionShell>
          ) : null}

          {currentTab === "listings" && user ? (
            <MyPageSectionShell title="내 영상관리">
              <MyPageMyListingsSection />
            </MyPageSectionShell>
          ) : null}

          {currentTab === "analytics" && user ? (
            <MyPageSectionShell
              title="판매 분석"
              description="등록한 릴스의 판매·노출 지표를 기간별로 확인할 수 있어요."
            >
              <MyPageSellerAnalyticsSection />
            </MyPageSectionShell>
          ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
