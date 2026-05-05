"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { SocialLinkFields } from "@/components/SocialLinkFields";
import { useAuthSession } from "@/hooks/useAuthSession";
import {
  fetchUserDataBlob,
  upsertUserDataBlob,
} from "@/lib/supabaseUserSync";
import {
  normalizeSellerSocialLinksInput,
  parseSellerSocialBlob,
} from "@/lib/sellerSocialLinks";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  fetchUserProfile,
  mergeProfileRowWithAuthUser,
  upsertUserProfile,
  type AppProfile,
} from "@/lib/supabaseProfiles";
import { useTranslation } from "@/hooks/useTranslation";

const SOCIAL_LINKS_BLOB_KEY = "social_links";

const MAX_SOCIAL_LINK_ROWS = 20;

const SNS_URL_PRESETS = [
  { prefix: "https://www.tiktok.com/@", label: "TikTok" },
  { prefix: "https://www.instagram.com/", label: "Instagram" },
  { prefix: "https://www.youtube.com/@", label: "YouTube" },
  { prefix: "https://x.com/", label: "X" },
] as const;

function nz(s: string): string | null {
  const t = s.trim();
  return t.length > 0 ? t : null;
}

function readGoogleLikeName(user: User): string {
  const m = (user.user_metadata ?? {}) as Record<string, unknown>;
  if (typeof m.full_name === "string" && m.full_name.trim()) return m.full_name.trim();
  if (typeof m.name === "string" && m.name.trim()) return m.name.trim();
  const g = m.given_name;
  const f = m.family_name;
  const parts = [typeof g === "string" ? g : "", typeof f === "string" ? f : ""]
    .join(" ")
    .trim();
  if (parts) return parts;
  const emailLocal = user.email?.split("@")[0]?.trim();
  return emailLocal || "—";
}

function readAvatarUrl(user: User): string | null {
  const m = (user.user_metadata ?? {}) as Record<string, unknown>;
  if (typeof m.avatar_url === "string" && /^https?:\/\//i.test(m.avatar_url)) {
    return m.avatar_url;
  }
  if (typeof m.picture === "string" && /^https?:\/\//i.test(m.picture)) {
    return m.picture;
  }
  return null;
}

function isGoogleUser(user: User): boolean {
  const providers = user.app_metadata?.providers;
  return Boolean(
    user.identities?.some((i) => i.provider === "google") ||
      user.app_metadata?.provider === "google" ||
      (Array.isArray(providers) && providers.includes("google")),
  );
}

function appendLinkWithPrefix(links: string[], prefix: string): string[] {
  const emptyIdx = links.findIndex((s) => !s.trim());
  if (emptyIdx >= 0) {
    const next = [...links];
    next[emptyIdx] = prefix;
    return next;
  }
  if (links.length >= MAX_SOCIAL_LINK_ROWS) return links;
  return [...links, prefix];
}

const cardShell =
  "rounded-2xl border border-white/10 bg-zinc-900/35 p-5 shadow-sm [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white";

const inputNickname =
  "mt-2 w-full rounded-xl border border-white/15 bg-black/25 px-3.5 py-2.5 text-[15px] text-zinc-100 outline-none transition focus:border-white/35 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-900";

export function MyPageProfileEditForm({
  profileForForm,
  onSaved,
}: {
  /** DB 행 + 로그인 메타 병합 결과 (부모에서 mergeProfileRowWithAuthUser 로 생성) */
  profileForForm: AppProfile | null;
  onSaved: (p: AppProfile) => void;
}) {
  const { t } = useTranslation();
  const { user, supabaseConfigured } = useAuthSession();
  const [nickname, setNickname] = useState("");
  const [socialLinks, setSocialLinks] = useState<string[]>([""]);
  const [socialLinksReady, setSocialLinksReady] = useState(false);
  const [socialBusy, setSocialBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profileForForm) {
      setNickname("");
      return;
    }
    setNickname(profileForForm.nickname ?? "");
  }, [profileForForm]);

  useEffect(() => {
    let cancelled = false;
    const loadSocialLinks = async () => {
      if (!user || !supabaseConfigured) {
        setSocialLinks([""]);
        setSocialLinksReady(false);
        return;
      }
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setSocialLinks([""]);
        setSocialLinksReady(false);
        return;
      }

      const blob = await fetchUserDataBlob(supabase, user.id, SOCIAL_LINKS_BLOB_KEY);
      if (cancelled) return;
      const parsedFromBlob = parseSellerSocialBlob(blob);
      if (parsedFromBlob.length > 0) {
        setSocialLinks(parsedFromBlob.map((x) => x.url));
      } else {
        const metaLinks = Array.isArray((user.user_metadata as { social_links?: unknown })?.social_links)
          ? (user.user_metadata as { social_links: unknown[] }).social_links
              .filter((x): x is string => typeof x === "string")
          : [];
        const parsedFromMeta = normalizeSellerSocialLinksInput(metaLinks);
        setSocialLinks(parsedFromMeta.length > 0 ? parsedFromMeta.map((x) => x.url) : [""]);
      }
      setSocialLinksReady(true);
    };
    void loadSocialLinks();
    return () => {
      cancelled = true;
    };
  }, [user, supabaseConfigured]);

  const save = useCallback(async () => {
    setMessage(null);
    if (!user || !supabaseConfigured) {
      setMessage(t("profileForm.saveLoginRequired"));
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage(t("profileForm.supabaseCheck"));
      return;
    }
    setBusy(true);
    try {
      const preserved = {
        first_name: profileForForm?.first_name ?? null,
        last_name: profileForForm?.last_name ?? null,
        phone: profileForForm?.phone ?? null,
        phone_country_code: profileForForm?.phone_country_code ?? null,
        country: profileForForm?.country ?? null,
        timezone: profileForForm?.timezone ?? null,
      };
      const patch = {
        nickname: nz(nickname),
        ...preserved,
      };
      const { error: authErr } = await supabase.auth.updateUser({
        data: { nickname: patch.nickname },
      });
      if (authErr) {
        setMessage(t("profileForm.authMetaFailed"));
        return;
      }
      const updated = await upsertUserProfile(supabase, user.id, {
        ...patch,
        email: user.email ?? profileForForm?.email ?? null,
      });
      if (updated) {
        onSaved(updated);
        setMessage(null);
        return;
      }
      const { data: authFresh, error: refreshErr } = await supabase.auth.getUser();
      const freshUser = authFresh.user;
      if (refreshErr || !freshUser) {
        setMessage(t("profileForm.saveStateUnknown"));
        return;
      }
      const row = await fetchUserProfile(supabase, user.id);
      onSaved(mergeProfileRowWithAuthUser(row, freshUser));
      setMessage(null);
    } finally {
      setBusy(false);
    }
  }, [user, supabaseConfigured, nickname, profileForForm, onSaved, t]);

  useEffect(() => {
    if (!user || !supabaseConfigured || !socialLinksReady) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const timer = window.setTimeout(async () => {
      setSocialBusy(true);
      const normalized = normalizeSellerSocialLinksInput(socialLinks);
      const ok = await upsertUserDataBlob(
        supabase,
        user.id,
        SOCIAL_LINKS_BLOB_KEY,
        normalized,
      );
      setSocialBusy(false);
      if (!ok) {
        setMessage(t("profileForm.socialSaveFailed"));
        return;
      }
      window.dispatchEvent(
        new CustomEvent("seller-social-links-updated", {
          detail: { sellerId: user.id, links: normalized },
        }),
      );
    }, 450);

    return () => window.clearTimeout(timer);
  }, [socialLinks, socialLinksReady, supabaseConfigured, user, t]);

  if (!user) {
    return (
      <p className="text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
        {t("profileForm.loginToEdit")}
      </p>
    );
  }

  const google = isGoogleUser(user);
  const displayName = readGoogleLikeName(user);
  const avatarUrl = readAvatarUrl(user);

  return (
    <div className="space-y-5">
      <section className={cardShell} aria-label={t("profileForm.loginAccount")}>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
          {t("profileForm.loginAccount")}
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- OAuth 외부 아바타
            <img
              src={avatarUrl}
              alt=""
              className="h-14 w-14 shrink-0 rounded-full border border-white/15 object-cover [html[data-theme='light']_&]:border-zinc-200"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-xl font-bold text-zinc-400 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100"
              aria-hidden
            >
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {google ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-0.5 text-[12px] font-semibold text-zinc-200 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-800">
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {t("profileForm.googleLogin")}
                </span>
              ) : (
                <span className="text-[12px] font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                  {String(user.app_metadata?.provider ?? "—")}
                </span>
              )}
            </div>
            <p className="mt-2 truncate text-[18px] font-semibold tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
              {displayName}
            </p>
            <p className="mt-0.5 truncate text-[14px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
              {user.email ?? ""}
            </p>
            <p className="mt-2 text-[12px] leading-snug text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              {google ? t("profileForm.googleLoginHint") : t("profileForm.otherLoginHint")}
            </p>
          </div>
        </div>
      </section>

      <section className={cardShell} aria-labelledby="profile-display-name">
        <h3
          id="profile-display-name"
          className="text-[15px] font-semibold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
        >
          {t("profileForm.displayNameTitle")}
        </h3>
        <p className="mt-1 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          {t("profileForm.nicknameDashboardHint")}
        </p>
        <label className="mt-3 block text-[12px] font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">
          {t("profileForm.nickname")}
          <input
            className={inputNickname}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoComplete="nickname"
          />
        </label>
        {message ? (
          <p
            className="mt-3 text-[13px] font-medium text-red-400 [html[data-theme='light']_&]:text-red-600"
            role="status"
          >
            {message}
          </p>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="mt-4 inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-[13px] font-semibold text-zinc-100 transition hover:border-white/28 hover:bg-white/[0.1] disabled:opacity-50 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:border-zinc-300"
        >
          {busy ? t("profileForm.saveBusy") : t("profileForm.save")}
        </button>
      </section>

      <section className={cardShell} aria-labelledby="profile-sns-dashboard">
        <h3
          id="profile-sns-dashboard"
          className="text-[15px] font-semibold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
        >
          {t("profileForm.snsDashboardTitle")}
        </h3>
        <p className="mt-1 text-[12px] leading-snug text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          {t("profileForm.snsHint")}
        </p>

        <div className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
            {t("profileForm.snsQuickTitle")}
          </p>
          <p className="mt-1 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {t("profileForm.snsQuickHint")}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SNS_URL_PRESETS.map(({ prefix, label }) => (
              <button
                key={prefix}
                type="button"
                onClick={() => setSocialLinks((prev) => appendLinkWithPrefix(prev, prefix))}
                className="rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2.5 text-left text-[13px] font-semibold text-zinc-100 transition hover:border-white/28 hover:bg-white/[0.09] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:border-zinc-300"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[12px] font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">
            {t("profileForm.snsHeading")}
          </p>
          <div className="mt-2">
            <SocialLinkFields
              links={socialLinks}
              onChange={setSocialLinks}
              placeholder={t("profileForm.snsPlaceholder")}
            />
          </div>
          {socialBusy ? (
            <p className="mt-2 text-[12px] font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
              {t("profileForm.snsSaving")}
            </p>
          ) : null}
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-white/15 bg-black/15 px-4 py-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50/80">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
            {t("profileForm.snsConnectComing")}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {t("profileForm.snsConnectSoon")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SNS_URL_PRESETS.map(({ label }) => (
              <button
                key={`oauth-${label}`}
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-zinc-500 opacity-60 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-500"
                aria-label={`${label} — ${t("profileForm.snsConnectSoon")}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
