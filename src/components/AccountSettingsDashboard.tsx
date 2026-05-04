"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaceProfileUploadSection } from "@/components/FaceProfileUploadSection";
import { MyPageAccountOverview } from "@/components/MyPageAccountOverview";
import { MyPagePasswordSection } from "@/components/MyPagePasswordSection";
import { MyPageProfileEditForm } from "@/components/MyPageProfileEditForm";
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

type SettingsTab = "basic" | "edit" | "profile";

const SETTINGS_TAB_ITEMS: { id: SettingsTab; label: string; href: string }[] = [
  { id: "basic", label: "기본정보", href: "/settings" },
  { id: "edit", label: "프로필 편집", href: "/settings?tab=edit" },
  { id: "profile", label: "AI 프로필 설정", href: "/settings?tab=profile" },
];

function LoginRequiredPanel({ tab }: { tab: { id: SettingsTab; label: string; href: string } }) {
  const redirect = encodeURIComponent(tab.href);

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl [html[data-theme='light']_&]:text-zinc-900">
        {tab.label}
      </h2>
      <div className="mt-8 rounded-xl border border-dashed border-white/15 bg-black/25 p-8 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50/80">
        <p className="text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          로그인하면 설정의 {tab.label}을 포함한 계정 관리 기능을 이용할 수 있어요.
        </p>
        <Link
          href={`/login?redirect=${redirect}`}
          className="mt-5 inline-flex rounded-full bg-reels-crimson px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_6px_20px_-6px_rgba(228,41,128,0.45)] transition hover:brightness-[1.05]"
        >
          로그인
        </Link>
      </div>
    </div>
  );
}

function normalizeSettingsTab(input: string | null): SettingsTab {
  if (input === "profile") return "profile";
  if (input === "edit") return "edit";
  return "basic";
}

export function AccountSettingsDashboard() {
  const params = useSearchParams();
  const currentTab = normalizeSettingsTab(params.get("tab"));
  const activeTab = useMemo(
    () => SETTINGS_TAB_ITEMS.find((item) => item.id === currentTab) ?? SETTINGS_TAB_ITEMS[0],
    [currentTab],
  );
  const { user, supabaseConfigured, loading: authLoading } = useAuthSession();
  const { profile, hydrated } = useStoredFaceProfile();
  const [draftCount, setDraftCount] = useState(0);
  const [profileRecord, setProfileRecord] = useState<AppProfile | null>(null);

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
    <main className="min-h-[60vh] bg-zinc-950 text-zinc-100 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900">
      <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 sm:py-12 lg:px-10">
        <header className="border-b border-white/10 pb-8 [html[data-theme='light']_&]:border-zinc-100">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-[1.75rem] [html[data-theme='light']_&]:text-zinc-900">
            설정
          </h1>
        </header>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,13.5rem)_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-400">
              메뉴
            </p>
            <nav aria-label="설정 메뉴" className="flex flex-col gap-0.5">
              {SETTINGS_TAB_ITEMS.map((item) => {
                const active = item.id === currentTab;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={
                      active
                        ? "rounded-lg border-l-[3px] border-l-[#E42980] bg-white/[0.06] py-2.5 pl-[13px] pr-3 text-[14px] font-semibold text-zinc-50 transition-colors [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-900"
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

          {currentTab === "basic" && user ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 shadow-sm sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
              <MyPageAccountOverview />
              <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-10 [html[data-theme='light']_&]:border-zinc-100">
                <h2 className="text-lg font-semibold tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
                  기본정보
                </h2>
                {mySellerFeedHref ? (
                  <Link
                    href={mySellerFeedHref}
                    className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[12px] font-semibold text-zinc-100 transition hover:border-[#E42980] hover:text-[#F07AB0] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:text-[#E42980]"
                  >
                    내 판매 피드 가기
                  </Link>
                ) : null}
              </div>

              <MyPageProfileEditForm profileForForm={profileForForm} onSaved={setProfileRecord} />

              <MyPagePasswordSection />

              <div className="mt-10 border-t border-white/10 pt-10 [html[data-theme='light']_&]:border-zinc-100">
                <h3 className="text-[15px] font-semibold text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
                  계정 요약
                </h3>
                <div className="mt-6 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50/60">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-400">
                      아이디
                    </p>
                    <p className="mt-2 break-all text-[16px] font-semibold leading-snug text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
                      {displayId}
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-500">
                      {user?.email ? `이메일: ${user.email}` : "닉네임/이메일 연동 전 기본 계정입니다."}
                    </p>
                  </div>
                  <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50/60">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-400">
                      계정 상태
                    </p>
                    <p className="mt-2 text-[16px] font-semibold text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
                      정상
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-500">
                      {accountSummary}
                    </p>
                  </div>
                  <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50/60">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-400">
                      임시 저장
                    </p>
                    <p className="mt-1 text-[22px] font-semibold tabular-nums text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
                      {draftCount}
                    </p>
                    <p className="text-[11px] leading-snug text-zinc-400 [html[data-theme='light']_&]:text-zinc-500">
                      저장된 편집 항목 · 열어보려면 마이페이지 임시 저장 탭 이용
                    </p>
                  </div>
                  <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50/60">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-400">
                      프로필 얼굴
                    </p>
                    <p className="mt-1 break-words text-[15px] font-semibold text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
                      {profileLabel}
                    </p>
                    <p className="text-[11px] leading-snug text-zinc-400 [html[data-theme='light']_&]:text-zinc-500">
                      등록은{" "}
                      <Link href="/settings?tab=profile" className="font-semibold text-[#E42980] underline-offset-2 hover:underline">
                        AI 프로필 설정
                      </Link>
                      에서 변경할 수 있어요.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {currentTab === "edit" && user ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 shadow-sm sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
                프로필 편집
              </h2>
              <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                계정에 표시되는 프로필 이미지를 바꿀 수 있어요. 변경 내용은 계정에 저장됩니다.
              </p>
              <div className="mt-8 max-w-[420px]">
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
            </div>
          ) : null}

          {currentTab === "profile" && user ? <FaceProfileUploadSection /> : null}
          </section>
        </div>
      </div>
    </main>
  );
}
