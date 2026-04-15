"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaceProfileUploadSection } from "@/components/FaceProfileUploadSection";
import { MyPageSavedDraftsSection } from "@/components/MyPageSavedDraftsSection";
import { MyPageSellerAnalyticsSection } from "@/components/MyPageSellerAnalyticsSection";
import { ProfileAvatarPicker } from "@/components/ProfileAvatarPicker";
import { DEMO_FACE_PROFILES } from "@/data/demoFaceProfiles";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useStoredFaceProfile } from "@/hooks/useStoredFaceProfile";
import { readSavedCustomizeDraftIndex } from "@/lib/customizeDraftIndex";
import type { ProfileAvatar } from "@/lib/profileAvatarStorage";
import {
  readProfileAvatar,
  resolveProfileAvatar,
  writeProfileAvatar,
} from "@/lib/profileAvatarStorage";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { MyPageAccountOverview } from "@/components/MyPageAccountOverview";
import { MyPageStudioSection } from "@/components/MyPageStudioSection";

type MyPageTab = "basic" | "profile" | "drafts" | "samples" | "analytics" | "studio";

const TAB_ITEMS: { id: MyPageTab; label: string; href: string; desc: string }[] = [
  { id: "basic", label: "기본정보", href: "/mypage", desc: "아이디 · 활동 요약" },
  { id: "studio", label: "My Studio", href: "/mypage?tab=studio", desc: "AI 생성 기록 · 재다운로드" },
  { id: "analytics", label: "판매 분석", href: "/mypage?tab=analytics", desc: "수익·성장·영상별 지표" },
  { id: "profile", label: "프로필 관리", href: "/mypage?tab=profile", desc: "3면 얼굴 등록" },
  { id: "drafts", label: "임시 저장", href: "/mypage?tab=drafts", desc: "이어 편집 · 구매" },
  { id: "samples", label: "샘플 프로필", href: "/mypage?tab=samples", desc: "데모 얼굴 세트" },
];

function normalizeTab(input: string | null): MyPageTab {
  if (
    input === "profile" ||
    input === "drafts" ||
    input === "samples" ||
    input === "analytics" ||
    input === "studio"
  ) {
    return input;
  }
  return "basic";
}

export function MyPageDashboard() {
  const params = useSearchParams();
  const currentTab = normalizeTab(params.get("tab"));
  const { user } = useAuthSession();
  const { profile, hydrated } = useStoredFaceProfile();
  const [draftCount, setDraftCount] = useState(0);
  const [userId, setUserId] = useState("reels_user");
  const [profileAvatar, setProfileAvatar] = useState<ProfileAvatar | null>(null);

  useEffect(() => {
    setProfileAvatar(resolveProfileAvatar(user));
  }, [user]);

  useEffect(() => {
    const onAvatar = () => setProfileAvatar(readProfileAvatar());
    window.addEventListener("reels-profile-avatar-updated", onAvatar);
    return () => window.removeEventListener("reels-profile-avatar-updated", onAvatar);
  }, []);

  const persistProfileAvatar = useCallback(
    async (next: ProfileAvatar | null) => {
      writeProfileAvatar(next);
      setProfileAvatar(next);
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !user) return;
      try {
        await supabase.auth.updateUser({
          data: {
            avatar_kind: next?.kind ?? null,
            avatar_seed: next?.kind === "preset" ? next.seed : null,
            avatar_custom:
              next?.kind === "custom" ? JSON.stringify(next.parts) : null,
          },
        });
      } catch {
        /* noop */
      }
    },
    [user],
  );

  useEffect(() => {
    const loadMeta = () => {
      try {
        const key = "reels-market-user-id";
        const existing = window.localStorage.getItem(key);
        if (existing) {
          setUserId(existing);
        } else {
          const next = `reels_${new Date().getFullYear()}_${Math.floor(Math.random() * 9000 + 1000)}`;
          window.localStorage.setItem(key, next);
          setUserId(next);
        }
      } catch {
        setUserId("reels_user");
      }
      setDraftCount(readSavedCustomizeDraftIndex().length);
    };
    loadMeta();
    window.addEventListener("focus", loadMeta);
    window.addEventListener("reels-drafts-updated", loadMeta);
    return () => {
      window.removeEventListener("focus", loadMeta);
      window.removeEventListener("reels-drafts-updated", loadMeta);
    };
  }, []);

  const profileLabel = useMemo(() => {
    if (!hydrated) return "불러오는 중";
    if (!profile) return "미등록";
    return profile.kind === "triple" ? "3면 직접 등록됨" : "AI 3면 생성됨";
  }, [hydrated, profile]);

  return (
    <main className="mx-auto min-h-[60vh] max-w-[1500px] px-4 py-10 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:px-6 sm:py-12 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl [html[data-theme='light']_&]:text-zinc-900">마이페이지</h1>
          <p className="mt-2 text-[14px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">기본정보를 먼저 확인하고, 왼쪽 메뉴에서 세부 항목을 관리하세요.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="reels-glass-card rounded-2xl p-3 sm:p-4 lg:sticky lg:top-20 lg:h-fit">
          <nav aria-label="마이페이지 메뉴" className="space-y-1.5">
            {TAB_ITEMS.map((item) => {
              const active = item.id === currentTab;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`block rounded-xl border px-3 py-2.5 transition ${
                    active
                      ? "border-reels-cyan/45 bg-reels-cyan/15 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
                      : "border-white/10 bg-black/20 text-zinc-400 hover:border-white/20 hover:text-zinc-200 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:text-zinc-900"
                  }`}
                >
                  <p className="text-[13px] font-bold">{item.label}</p>
                  <p className="mt-0.5 text-[11px]">{item.desc}</p>
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">
          {currentTab === "basic" ? (
            <div className="reels-glass-card rounded-2xl p-5 sm:p-6">
              <MyPageAccountOverview />
              <h2 className="text-lg font-extrabold tracking-tight sm:text-xl">기본정보</h2>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
                <h3 className="text-[15px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                  프로필 이미지
                </h3>
                <div className="mt-4">
                  <ProfileAvatarPicker
                    value={profileAvatar}
                    onChange={persistProfileAvatar}
                    hint={
                      user
                        ? "변경 시 이 기기에도 저장되며, 로그인 계정 메타데이터에 프리셋 시드가 동기화됩니다. 직접 올린 사진은 기기 저장을 우선합니다."
                        : "로그인하면 선택한 프리셋이 계정에 연결됩니다. 직접 올린 사진은 이 브라우저에 저장됩니다."
                    }
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">아이디</p>
                  <p className="mt-2 text-[16px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">{userId}</p>
                  <p className="mt-1 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">닉네임/이메일 연동 전 기본 계정입니다.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">계정 상태</p>
                  <p className="mt-2 text-[16px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">정상</p>
                  <p className="mt-1 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">홈 · 카테고리 · 창작 스튜디오 이용 가능</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">임시 저장</p>
                  <p className="mt-1 text-[22px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">{draftCount}</p>
                  <p className="text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">저장된 편집 항목</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">프로필 얼굴</p>
                  <p className="mt-1 text-[15px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">{profileLabel}</p>
                  <p className="text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">창작 시 적용되는 얼굴 정보</p>
                </div>
              </div>
            </div>
          ) : null}

          {currentTab === "profile" ? <FaceProfileUploadSection /> : null}
          {currentTab === "drafts" ? <MyPageSavedDraftsSection /> : null}

          {currentTab === "studio" ? <MyPageStudioSection /> : null}

          {currentTab === "analytics" ? <MyPageSellerAnalyticsSection /> : null}

          {currentTab === "samples" ? (
            <section className="reels-glass-card rounded-2xl p-5 sm:p-6" aria-labelledby="profiles-heading">
              <h2 id="profiles-heading" className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                샘플 프로필 (창작 데모)
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                창작 시 이 얼굴이 영상에 반영됩니다.{" "}
                <Link href="/create?videoId=1" className="text-reels-cyan/90 hover:underline">
                  창작 스튜디오
                </Link>
                에서도 동일 세트를 선택할 수 있어요.
              </p>
              <ul className="mt-4 flex flex-wrap gap-4">
                {DEMO_FACE_PROFILES.map((p) => (
                  <li key={p.id} className="text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.src} alt="" className="mx-auto h-20 w-20 rounded-full border border-white/12 object-cover [html[data-theme='light']_&]:border-zinc-200" />
                    <p className="mt-1.5 text-[11px] font-medium text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">{p.label}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}
