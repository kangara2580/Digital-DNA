"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaceProfileUploadSection } from "@/components/FaceProfileUploadSection";
import { LocalePreferenceSelect } from "@/components/LocalePreferenceSelect";
import { MyPageAccountOverview } from "@/components/MyPageAccountOverview";
import { MyPagePasswordSection } from "@/components/MyPagePasswordSection";
import { MyPageProfileEditForm } from "@/components/MyPageProfileEditForm";
import { ProfileAvatarPicker } from "@/components/ProfileAvatarPicker";
import { useAuthSession } from "@/hooks/useAuthSession";
import type { ProfileAvatar } from "@/lib/profileAvatarStorage";
import { resolveProfileAvatar } from "@/lib/profileAvatarStorage";
import {
  loadProfileMergedWithBackfill,
  mergeProfileRowWithAuthUser,
  upsertUserProfile,
  type AppProfile,
} from "@/lib/supabaseProfiles";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useTranslation } from "@/hooks/useTranslation";
import { DocumentTitleI18n } from "@/components/DocumentTitleI18n";

type SettingsTab = "basic" | "edit" | "profile" | "language";

const SETTINGS_TAB_DEFS: { id: SettingsTab; href: string }[] = [
  { id: "basic", href: "/settings" },
  { id: "edit", href: "/settings?tab=edit" },
  { id: "profile", href: "/settings?tab=profile" },
  { id: "language", href: "/settings?tab=language" },
];

function LoginRequiredPanel({
  sectionLabel,
  redirectHref,
}: {
  sectionLabel: string;
  redirectHref: string;
}) {
  const { t } = useTranslation();
  const redirect = encodeURIComponent(redirectHref);

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl [html[data-theme='light']_&]:text-zinc-900">
        {sectionLabel}
      </h2>
      <div className="mt-8 rounded-xl border border-dashed border-white/15 bg-black/25 p-8 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50/80">
        <p className="text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          {t("settings.loginPrompt", { section: sectionLabel })}
        </p>
        <Link
          href={`/login?redirect=${redirect}`}
          className="mt-5 inline-flex rounded-full bg-reels-crimson px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_6px_20px_-6px_rgba(228,41,128,0.45)] transition hover:brightness-[1.05]"
        >
          {t("settings.loginCta")}
        </Link>
      </div>
    </div>
  );
}

function normalizeSettingsTab(input: string | null): SettingsTab {
  if (input === "profile") return "profile";
  if (input === "edit") return "edit";
  if (input === "language") return "language";
  return "basic";
}

export function AccountSettingsDashboard() {
  const params = useSearchParams();
  const { t } = useTranslation();
  const currentTab = normalizeSettingsTab(params.get("tab"));
  const activeHref =
    SETTINGS_TAB_DEFS.find((item) => item.id === currentTab)?.href ?? SETTINGS_TAB_DEFS[0].href;
  const activeSectionLabel = t(`settings.tab.${currentTab}`);
  const { user, loading: authLoading } = useAuthSession();
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

  const mySellerFeedHref = useMemo(
    () => (user?.id ? `/seller/${encodeURIComponent(user.id)}` : null),
    [user?.id],
  );

  return (
    <main className="min-h-[60vh] bg-zinc-950 text-zinc-100 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900">
      <DocumentTitleI18n titleKey="meta.settings" />
      <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 sm:py-12 lg:px-10">
        <header className="border-b border-white/10 pb-8 [html[data-theme='light']_&]:border-zinc-100">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-[1.75rem] [html[data-theme='light']_&]:text-zinc-900">
            {t("settings.title")}
          </h1>
        </header>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,13.5rem)_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-400">
              {t("settings.menu")}
            </p>
            <nav aria-label={t("settings.menu")} className="flex flex-col gap-0.5">
              {SETTINGS_TAB_DEFS.map((item) => {
                const active = item.id === currentTab;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={
                      active
                        ? "relative rounded-lg bg-white/[0.06] py-2.5 pl-3 pr-3 text-[14px] font-semibold text-zinc-50 transition-colors [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-900"
                        : "rounded-lg py-2.5 pl-3 pr-3 text-[14px] font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-100 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:bg-zinc-50 [html[data-theme='light']_&]:hover:text-zinc-900"
                    }
                  >
                    {active ? (
                      <span
                        className="pointer-events-none absolute left-1 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[#E42980]"
                        aria-hidden
                      />
                    ) : null}
                    {t(`settings.tab.${item.id}`)}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <section className="min-w-0">
          {authLoading && !user ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center [html[data-theme='light']_&]:border-zinc-100 [html[data-theme='light']_&]:bg-zinc-50/50">
              <p className="text-[14px] font-medium text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
                {t("settings.loading")}
              </p>
            </div>
          ) : null}
          {!authLoading && !user ? (
            <LoginRequiredPanel sectionLabel={activeSectionLabel} redirectHref={activeHref} />
          ) : null}

          {currentTab === "basic" && user ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 shadow-sm sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
              <MyPageAccountOverview />
              <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-10 [html[data-theme='light']_&]:border-zinc-100">
                <h2 className="text-lg font-semibold tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
                  {t("settings.tab.basic")}
                </h2>
                {mySellerFeedHref ? (
                  <Link
                    href={mySellerFeedHref}
                    className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[12px] font-semibold text-zinc-100 transition hover:border-[#E42980] hover:text-[#F07AB0] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:text-[#E42980]"
                  >
                    {t("account.feed")}
                  </Link>
                ) : null}
              </div>

              <MyPageProfileEditForm profileForForm={profileForForm} onSaved={setProfileRecord} />

              <MyPagePasswordSection />
            </div>
          ) : null}

          {currentTab === "edit" && user ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 shadow-sm sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
                {t("settings.tab.edit")}
              </h2>
              <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                {t("settings.edit.lead")}
              </p>
              <div className="mt-8 max-w-[420px]">
                <ProfileAvatarPicker
                  density="comfortable"
                  value={profileAvatar}
                  onChange={persistProfileAvatar}
                  hint={
                    user
                      ? t("settings.avatar.hintSaved")
                      : t("settings.avatar.hintGuest")
                  }
                />
              </div>
            </div>
          ) : null}

          {currentTab === "language" && user ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 shadow-sm sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
                {t("settings.language.heading")}
              </h2>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
                <span className="shrink-0 text-[14px] font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                  {t("settings.language.fieldLabel")}
                </span>
                <LocalePreferenceSelect
                  ariaLabel={t("settings.language.selectAria")}
                  className="shrink-0"
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
