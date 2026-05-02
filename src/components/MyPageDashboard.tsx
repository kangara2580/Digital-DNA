"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaceProfileUploadSection } from "@/components/FaceProfileUploadSection";
import { MyPageMyListingsSection } from "@/components/MyPageMyListingsSection";
import { MyPageSavedDraftsSection } from "@/components/MyPageSavedDraftsSection";
import { MyPageSellerAnalyticsSection } from "@/components/MyPageSellerAnalyticsSection";
import { ProfileAvatarPicker } from "@/components/ProfileAvatarPicker";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useStoredFaceProfile } from "@/hooks/useStoredFaceProfile";
import { fetchUserCustomizeDrafts } from "@/lib/supabaseUserSync";
import type { ProfileAvatar } from "@/lib/profileAvatarStorage";
import { resolveProfileAvatar } from "@/lib/profileAvatarStorage";
import {
  loadProfileMergedWithBackfill,
  mergeProfileRowWithAuthUser,
  upsertUserProfile,
  type AppProfile,
} from "@/lib/supabaseProfiles";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { MyPageAccountOverview } from "@/components/MyPageAccountOverview";
import { MyPagePasswordSection } from "@/components/MyPagePasswordSection";
import { MyPageProfileEditForm } from "@/components/MyPageProfileEditForm";
import { MyPageSavedVideosSection } from "@/components/MyPageSavedVideosSection";

type MyPageTab = "basic" | "profile" | "drafts" | "analytics" | "listings" | "saved";

const TAB_ITEMS: { id: MyPageTab; label: string; href: string; desc: string }[] = [
  { id: "basic", label: "기본정보", href: "/mypage", desc: "아이디 · 활동 요약" },
  { id: "listings", label: "내 등록 영상", href: "/mypage?tab=listings", desc: "판매로 올린 릴스" },
  { id: "saved", label: "찜 · 좋아요", href: "/mypage?tab=saved", desc: "찜 목록과 좋아요한 영상" },
  { id: "analytics", label: "판매 분석", href: "/mypage?tab=analytics", desc: "수익·성장·영상별 지표" },
  { id: "profile", label: "프로필 관리", href: "/mypage?tab=profile", desc: "3면 얼굴 등록" },
  { id: "drafts", label: "임시 저장", href: "/mypage?tab=drafts", desc: "이어 편집 · 구매" },
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
  if (
    input === "profile" ||
    input === "drafts" ||
    input === "analytics" ||
    input === "listings" ||
    input === "saved"
  ) {
    return input;
  }
  return "basic";
}

export function MyPageDashboard() {
  const params = useSearchParams();
  const currentTab = normalizeTab(params.get("tab"));
  const activeTab = useMemo(
    () => TAB_ITEMS.find((item) => item.id === currentTab) ?? TAB_ITEMS[0],
    [currentTab],
  );
  const { user, supabaseConfigured, loading: authLoading } = useAuthSession();
  const { profile, hydrated } = useStoredFaceProfile();
  const [draftCount, setDraftCount] = useState(0);
  const [profileRecord, setProfileRecord] = useState<AppProfile | null>(null);

  /** DB에 아직 행이 없거나 비어 있어도, 세션·로그인 메타와 합쳐 폼에 바로 표시 */
  const profileForForm = useMemo(
    () => (user ? mergeProfileRowWithAuthUser(profileRecord, user) : null),
    [profileRecord, user],
  );

  const profileAvatar = useMemo(
    () => resolveProfileAvatar(user, profileForForm),
    [user, profileForForm],
  );

  const persistProfileAvatar = useCallback(
    async (next: ProfileAvatar | null) => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !user) return;
      try {
        await supabase.auth.updateUser({
          data: {
            avatar_kind: next?.kind ?? null,
            avatar_seed: next?.kind === "preset" ? next.seed : null,
            avatar_custom:
              next?.kind === "custom"
                ? JSON.stringify(next.parts)
                : next?.kind === "upload"
                  ? next.dataUrl
                  : null,
          },
        });
        const updated = await upsertUserProfile(supabase, user.id, {
          avatar_kind: next?.kind ?? null,
          avatar_seed: next?.kind === "preset" ? next.seed : null,
          avatar_custom:
            next?.kind === "custom"
              ? JSON.stringify(next.parts)
              : next?.kind === "upload"
                ? next.dataUrl
                : null,
        });
        if (updated) setProfileRecord(updated);
      } catch {
        /* noop */
      }
    },
    [user],
  );

  const refreshDraftCount = useCallback(() => {
    if (!user || !supabaseConfigured) {
      setDraftCount(0);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    void fetchUserCustomizeDrafts(supabase, user.id).then((rows) => {
      setDraftCount(rows.length);
    });
  }, [user, supabaseConfigured]);

  useEffect(() => {
    refreshDraftCount();
    window.addEventListener("focus", refreshDraftCount);
    window.addEventListener("reels-drafts-updated", refreshDraftCount);
    return () => {
      window.removeEventListener("focus", refreshDraftCount);
      window.removeEventListener("reels-drafts-updated", refreshDraftCount);
    };
  }, [refreshDraftCount]);

  useEffect(() => {
    if (!user) {
      setProfileRecord(null);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let cancelled = false;

    const loadAndSync = async () => {
      const merged = await loadProfileMergedWithBackfill(supabase, user);
      if (cancelled) return;
      setProfileRecord(merged);
    };

    void loadAndSync();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const displayId = useMemo(() => {
    const nickname = String(profileForForm?.nickname ?? "").trim();
    const email = String(profileForForm?.email ?? user?.email ?? "").trim();
    if (nickname) return nickname;
    if (email) return email;
    return user?.id ? `id·${user.id.slice(0, 8)}…` : "계정";
  }, [profileForForm?.email, profileForForm?.nickname, user?.email, user?.id]);

  const accountSummary = useMemo(() => {
    const firstName = String(profileForForm?.first_name ?? "").trim();
    const lastName = String(profileForForm?.last_name ?? "").trim();
    const phone = String(profileForForm?.phone ?? "").trim();
    const country = String(profileForForm?.country ?? "").trim();
    const name = [firstName, lastName].filter(Boolean).join(" ").trim();
    const details = [name, phone, country].filter(Boolean);
    if (details.length > 0) return details.join(" · ");
    return "가입 정보가 없으면 다음 로그인 시 동기화됩니다.";
  }, [
    profileForForm?.country,
    profileForForm?.first_name,
    profileForForm?.last_name,
    profileForForm?.phone,
  ]);

  const profileLabel = useMemo(() => {
    if (!hydrated) return "불러오는 중";
    if (!profile) return "미등록";
    return profile.kind === "triple" ? "3면 직접 등록됨" : "AI 3면 생성됨";
  }, [hydrated, profile]);

  const mySellerFeedHref = useMemo(
    () => (user?.id ? `/seller/${encodeURIComponent(user.id)}` : null),
    [user?.id],
  );

  return (
    <main className="mx-auto min-h-[60vh] max-w-[1500px] px-3 py-8 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:px-5 sm:py-10 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
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
                  <p className="mt-0.5 text-[10px] leading-snug text-zinc-500 [html[data-theme='light']_&]:text-zinc-600 sm:text-[11px]">
                    {item.desc}
                  </p>
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

          {currentTab === "basic" && user ? (
            <div className="reels-glass-card rounded-xl p-4 sm:rounded-2xl sm:p-5 lg:p-6">
              <MyPageAccountOverview />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold tracking-tight sm:text-xl">기본정보</h2>
                {mySellerFeedHref ? (
                  <Link
                    href={mySellerFeedHref}
                    className="inline-flex rounded-full border border-reels-cyan/40 bg-reels-cyan/10 px-3 py-1.5 text-[12px] font-extrabold text-reels-cyan transition hover:bg-reels-cyan/20"
                  >
                    내 판매 피드 가기
                  </Link>
                ) : null}
              </div>

              <MyPageProfileEditForm
                profileForForm={profileForForm}
                onSaved={setProfileRecord}
              />

              {user ? <MyPagePasswordSection /> : null}

              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
                <h3 className="text-[15px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                  프로필 이미지
                </h3>
                <div className="mt-4 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
                  <div className="h-full">
                    <ProfileAvatarPicker
                      density="comfortable"
                      value={profileAvatar}
                      onChange={persistProfileAvatar}
                      hint={
                        user
                          ? "변경 내용은 계정에 저장됩니다."
                          : "로그인 후 프로필 이미지를 계정에 연결할 수 있습니다."
                      }
                    />
                  </div>

                  <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">아이디</p>
                      <p className="mt-2 break-all text-[16px] font-extrabold leading-snug text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                        {displayId}
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                        {user?.email ? `이메일: ${user.email}` : "닉네임/이메일 연동 전 기본 계정입니다."}
                      </p>
                    </div>
                    <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">계정 상태</p>
                      <p className="mt-2 text-[16px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">정상</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                        {accountSummary}
                      </p>
                    </div>
                    <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">임시 저장</p>
                      <p className="mt-1 text-[22px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">{draftCount}</p>
                      <p className="text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">저장된 편집 항목</p>
                    </div>
                    <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">프로필 얼굴</p>
                      <p className="mt-1 break-words text-[15px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">{profileLabel}</p>
                      <p className="text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">창작 시 적용되는 얼굴 정보</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {currentTab === "profile" && user ? <FaceProfileUploadSection /> : null}
          {currentTab === "drafts" && user ? <MyPageSavedDraftsSection /> : null}

          {currentTab === "saved" && user ? <MyPageSavedVideosSection /> : null}

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
