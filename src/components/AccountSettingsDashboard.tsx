"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaceProfileUploadSection } from "@/components/FaceProfileUploadSection";
import { LocalePreferenceSelect } from "@/components/LocalePreferenceSelect";
import { MyPageProfileEditForm } from "@/components/MyPageProfileEditForm";
import { useAuthSession } from "@/hooks/useAuthSession";
import type { ProfileAvatar } from "@/lib/profileAvatarStorage";
import {
  needsProfileColorMigration,
  profileAvatarToAuthMetaPatch,
  profileAvatarToDbPatch,
  resolveProfileAvatar,
} from "@/lib/profileAvatarStorage";
import { profileColorFromSeed } from "@/lib/profileColorSpectrum";
import {
  loadProfileMergedWithBackfill,
  mergeProfileRowWithAuthUser,
  upsertUserProfile,
  type AppProfile,
} from "@/lib/supabaseProfiles";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { updateAuthUserSafe } from "@/lib/supabaseAuthSerialize";
import { useTranslation } from "@/hooks/useTranslation";
import { DocumentTitleI18n } from "@/components/DocumentTitleI18n";
import { SettingsThemeSection } from "@/components/SettingsThemeSection";
import {
  ACCOUNT_PAGE_ASIDE_CLASS,
  ACCOUNT_PAGE_CONTAINER_CLASS,
  ACCOUNT_PAGE_LAYOUT_CLASS,
  ACCOUNT_PAGE_HEADER_CLASS,
  ACCOUNT_PAGE_MAIN_CLASS,
  ACCOUNT_PAGE_MENU_LABEL_CLASS,
  ACCOUNT_PAGE_SECTION_CLASS,
  ACCOUNT_PAGE_TITLE_CLASS,
} from "@/lib/accountSidebarLayout";
import {
  sidebarNavLinkActiveClass,
  sidebarNavLinkInactiveClass,
} from "@/lib/brandPinkTokens";

type SettingsTab = "basic" | "profile" | "language" | "theme";

const SETTINGS_TAB_DEFS: { id: SettingsTab; href: string }[] = [
  { id: "basic", href: "/settings" },
  { id: "profile", href: "/settings?tab=profile" },
  { id: "language", href: "/settings?tab=language" },
  { id: "theme", href: "/settings?tab=theme" },
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
      <h2 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-[1.375rem] [html[data-theme='light']_&]:text-zinc-900">
        {sectionLabel}
      </h2>
      <div className="mt-8 rounded-xl border border-dashed border-white/15 bg-black/25 p-8 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50/80">
        <p className="text-[16px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          {t("settings.loginPrompt", { section: sectionLabel })}
        </p>
        <Link
          href={`/login?redirect=${redirect}`}
          className="mt-5 inline-flex items-center justify-center rounded-full border border-white/20 bg-white/[0.08] px-5 py-2.5 text-[16px] font-semibold text-zinc-100 shadow-sm transition hover:border-white/35 hover:bg-white/[0.12] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:border-zinc-300"
        >
          {t("settings.loginCta")}
        </Link>
      </div>
    </div>
  );
}

function normalizeSettingsTab(input: string | null): SettingsTab {
  if (input === "profile") return "profile";
  if (input === "language") return "language";
  if (input === "theme") return "theme";
  return "basic";
}

export function AccountSettingsDashboard() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useTranslation();
  const tabParam = params.get("tab");
  const redirectingFromPurchasesTab = tabParam === "purchases";
  useEffect(() => {
    if (tabParam === "purchases") {
      router.replace("/mypage?tab=purchases");
    }
  }, [router, tabParam]);
  const currentTab = normalizeSettingsTab(tabParam);
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
    async (next: ProfileAvatar | null): Promise<{
      ok: boolean;
      error?: string;
    }> => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !user) return { ok: false, error: "no_client" };

      try {
        if (next?.kind === "upload") {
          let res: Response;
          try {
            res = await fetch("/api/profile/avatar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ dataUrl: next.dataUrl }),
            });
          } catch {
            return { ok: false, error: "network" };
          }
          const payload = (await res.json().catch(() => null)) as {
            ok?: boolean;
            error?: string;
            url?: string;
          } | null;
          if (!res.ok || !payload?.ok || !payload.url) {
            return {
              ok: false,
              error: payload?.error ?? "upload_failed",
            };
          }
          const saved: ProfileAvatar = { kind: "upload", dataUrl: payload.url };
          const merged = await loadProfileMergedWithBackfill(supabase, user);
          if (merged) {
            setProfileRecord(
              mergeProfileRowWithAuthUser(
                { ...merged, ...profileAvatarToDbPatch(saved) },
                user,
              ),
            );
          }
          return { ok: true };
        }

        const dbPatch = profileAvatarToDbPatch(next);
        const authMetaPatch = profileAvatarToAuthMetaPatch(next);
        const upserted = await upsertUserProfile(supabase, user.id, dbPatch);
        if (!upserted) return { ok: false, error: "profile_save_failed" };

        const { user: authUser, error: authErr } = await updateAuthUserSafe(supabase, {
          data: authMetaPatch,
        });
        if (authErr) return { ok: false, error: "auth_meta_failed" };

        const mergedAuthUser = authUser ?? user;
        setProfileRecord(mergeProfileRowWithAuthUser(upserted, mergedAuthUser));
        return { ok: true };
      } catch {
        return { ok: false, error: "unknown" };
      }
    },
    [user],
  );

  const patchProfileRecordAvatar = useCallback(
    (next: ProfileAvatar | null) => {
      if (!user) return;
      setProfileRecord((prev) => {
        const empty: AppProfile = {
          user_id: user.id,
          email: null,
          nickname: null,
          first_name: null,
          last_name: null,
          phone: null,
          phone_country_code: null,
          country: null,
          timezone: null,
          avatar_kind: null,
          avatar_seed: null,
          avatar_custom: null,
        };
        const base = prev ?? empty;
        return mergeProfileRowWithAuthUser({ ...base, ...profileAvatarToDbPatch(next) }, user);
      });
    },
    [user],
  );

  const onProfileAvatarPick = useCallback(
    async (next: ProfileAvatar) => {
      if (!user) return;
      patchProfileRecordAvatar(next);

      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      const result = await persistProfileAvatar(next);
      if (!result.ok) {
        if (next.kind === "upload") {
          if (result.error === "bucket_missing") {
            window.alert(t("avatar.alertStorageNotReady"));
          } else {
            window.alert(t("avatar.alertSaveFail"));
          }
        }
        const merged = await loadProfileMergedWithBackfill(supabase, user);
        if (merged) setProfileRecord(merged);
      }
    },
    [user, patchProfileRecordAvatar, persistProfileAvatar, t],
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
      try {
        let merged = await loadProfileMergedWithBackfill(supabase, user);
        if (cancelled) return;

        if (merged && needsProfileColorMigration(merged)) {
          const colorAvatar = {
            kind: "color" as const,
            hex: profileColorFromSeed(user.id),
          };
          const dbPatch = profileAvatarToDbPatch(colorAvatar);
          const authMetaPatch = profileAvatarToAuthMetaPatch(colorAvatar);
          const { error: migrateErr } = await updateAuthUserSafe(supabase, {
            data: authMetaPatch,
          });
          if (!migrateErr) {
            const upserted = await upsertUserProfile(supabase, user.id, dbPatch);
            merged = upserted ?? { ...merged, ...dbPatch };
          }
        }

        if (!cancelled) setProfileRecord(merged);
      } catch {
        if (!cancelled) {
          setProfileRecord(mergeProfileRowWithAuthUser(null, user));
        }
      }
    };

    void loadAndSync();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (redirectingFromPurchasesTab) {
    return (
      <main className={ACCOUNT_PAGE_MAIN_CLASS}>
        <DocumentTitleI18n titleKey="meta.settings" />
        <div className={`${ACCOUNT_PAGE_CONTAINER_CLASS} py-20 text-center`}>
          <p className="text-[16px] font-medium text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
            {t("common.loading")}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={ACCOUNT_PAGE_MAIN_CLASS}>
      <DocumentTitleI18n titleKey="meta.settings" />
      <div className={ACCOUNT_PAGE_CONTAINER_CLASS}>
        <div className={ACCOUNT_PAGE_LAYOUT_CLASS}>
        <header className={ACCOUNT_PAGE_HEADER_CLASS}>
          <h1 className={ACCOUNT_PAGE_TITLE_CLASS}>
            {t("settings.title")}
          </h1>
        </header>

          <aside className={ACCOUNT_PAGE_ASIDE_CLASS}>
            <p className={ACCOUNT_PAGE_MENU_LABEL_CLASS}>
              {t("settings.menu")}
            </p>
            <nav aria-label={t("settings.menu")} className="flex flex-col gap-0.5">
              {SETTINGS_TAB_DEFS.map((item) => {
                const active = item.id === currentTab;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={active ? sidebarNavLinkActiveClass : sidebarNavLinkInactiveClass}
                  >
                    {t(`settings.tab.${item.id}`)}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <section className={ACCOUNT_PAGE_SECTION_CLASS}>
          {authLoading && !user ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center [html[data-theme='light']_&]:border-zinc-100 [html[data-theme='light']_&]:bg-zinc-50/50">
              <p className="text-[16px] font-medium text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
                {t("settings.loading")}
              </p>
            </div>
          ) : null}
          {!authLoading && !user && currentTab !== "theme" ? (
            <LoginRequiredPanel sectionLabel={activeSectionLabel} redirectHref={activeHref} />
          ) : null}

          {currentTab === "basic" && user ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 shadow-sm sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
                {t("settings.tab.basic")}
              </h2>

              <div className="mt-10">
                <MyPageProfileEditForm
                  profileForForm={profileForForm}
                  onSaved={setProfileRecord}
                  profileAvatar={profileAvatar}
                  onProfileAvatarChange={onProfileAvatarPick}
                />
              </div>
            </div>
          ) : null}

          {currentTab === "language" && user ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 shadow-sm sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
                {t("settings.language.heading")}
              </h2>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
                <span className="shrink-0 text-[16px] font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
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

          {currentTab === "theme" ? <SettingsThemeSection /> : null}

          </section>
        </div>
      </div>
    </main>
  );
}
