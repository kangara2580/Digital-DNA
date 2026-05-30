"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SocialLinkFields } from "@/components/SocialLinkFields";
import { ProfileColorPicker } from "@/components/ProfileColorPicker";
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
import { updateAuthUserSafe } from "@/lib/supabaseAuthSerialize";
import {
  fetchUserProfile,
  mergeProfileRowWithAuthUser,
  upsertUserProfile,
  type AppProfile,
} from "@/lib/supabaseProfiles";
import { useTranslation } from "@/hooks/useTranslation";
import type { ProfileAvatar } from "@/lib/profileAvatarStorage";

const SOCIAL_LINKS_BLOB_KEY = "social_links";

const MAX_SOCIAL_LINK_ROWS = 20;

const SNS_URL_PRESETS = [
  { prefix: "https://www.tiktok.com/", label: "TikTok" },
  { prefix: "https://www.instagram.com/", label: "Instagram" },
  { prefix: "https://www.youtube.com/", label: "YouTube" },
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

function profileAvatarEqual(
  a: ProfileAvatar | null,
  b: ProfileAvatar | null,
): boolean {
  if (a === b) return true;
  if (!a || !b) return !a && !b;
  if (a.kind !== b.kind) return false;
  if (a.kind === "color" && b.kind === "color") return a.hex === b.hex;
  if (a.kind === "upload" && b.kind === "upload") return a.dataUrl === b.dataUrl;
  return false;
}

const cardShell =
  "rounded-2xl border border-white/10 bg-zinc-900/35 p-5 shadow-sm [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white";

const inputNickname =
  "mt-2 w-full rounded-xl border border-white/15 bg-black/25 px-3.5 py-2.5 text-[17px] text-zinc-100 outline-none transition focus:border-white/35 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-900";

const applyBtnClass =
  "w-full rounded-xl bg-[color:var(--reels-point)] px-6 py-3.5 text-[17px] font-bold text-white shadow-sm transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-45";

export function MyPageProfileEditForm({
  profileForForm,
  onSaved,
  profileAvatar,
  onProfileAvatarApply,
}: {
  /** DB 행 + 로그인 메타 병합 결과 (부모에서 mergeProfileRowWithAuthUser 로 생성) */
  profileForForm: AppProfile | null;
  onSaved: (p: AppProfile) => void;
  profileAvatar: ProfileAvatar | null;
  onProfileAvatarApply: (next: ProfileAvatar) => Promise<{ ok: boolean; error?: string }>;
}) {
  const { t } = useTranslation();
  const { user, supabaseConfigured } = useAuthSession();
  const [nickname, setNickname] = useState("");
  const [draftAvatar, setDraftAvatar] = useState<ProfileAvatar | null>(profileAvatar);
  const [socialLinks, setSocialLinks] = useState<string[]>([""]);
  const [socialLinksReady, setSocialLinksReady] = useState(false);
  const [applyBusy, setApplyBusy] = useState(false);
  /** 닉네임 저장 실패 등 — 적용 시 표시 */
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const [applySucceeded, setApplySucceeded] = useState(false);
  const socialSnapshotRef = useRef<string | null>(null);

  useEffect(() => {
    setDraftAvatar(profileAvatar);
  }, [profileAvatar]);

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
      let linkUrls: string[];
      if (parsedFromBlob.length > 0) {
        linkUrls = parsedFromBlob.map((x) => x.url);
      } else {
        const metaLinks = Array.isArray(
          (user.user_metadata as { social_links?: unknown })?.social_links,
        )
          ? (user.user_metadata as { social_links: unknown[] }).social_links.filter(
              (x): x is string => typeof x === "string",
            )
          : [];
        const parsedFromMeta = normalizeSellerSocialLinksInput(metaLinks);
        linkUrls =
          parsedFromMeta.length > 0 ? parsedFromMeta.map((x) => x.url) : [""];
      }
      setSocialLinks(linkUrls);
      socialSnapshotRef.current = JSON.stringify(
        normalizeSellerSocialLinksInput(linkUrls),
      );
      setSocialLinksReady(true);
    };
    void loadSocialLinks();
    return () => {
      cancelled = true;
      socialSnapshotRef.current = null;
    };
  }, [user, supabaseConfigured]);

  const saveNickname = useCallback(async (): Promise<boolean> => {
    if (!user || !supabaseConfigured) {
      setApplyMessage(t("profileForm.saveLoginRequired"));
      return false;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setApplyMessage(t("profileForm.supabaseCheck"));
      return false;
    }
    const preserved = {
      first_name: profileForForm?.first_name ?? null,
      last_name: profileForForm?.last_name ?? null,
      phone: profileForForm?.phone ?? null,
      phone_country_code: profileForForm?.phone_country_code ?? null,
      country: profileForForm?.country ?? null,
      timezone: profileForForm?.timezone ?? null,
    };
    const nextNick = nz(nickname);
    const prevNick = nz(profileForForm?.nickname ?? "");
    if (nextNick === prevNick) return true;

    try {
      const patch = {
        nickname: nextNick,
        ...preserved,
      };
      const { user: freshUser, error: authErr } = await updateAuthUserSafe(supabase, {
        data: { nickname: patch.nickname },
      });
      if (authErr) {
        setApplyMessage(t("profileForm.authMetaFailed"));
        return false;
      }
      const updated = await upsertUserProfile(supabase, user.id, {
        ...patch,
        email: user.email ?? profileForForm?.email ?? null,
      });
      if (updated) {
        onSaved(updated);
        return true;
      }
      const authUser = freshUser ?? user;
      const row = await fetchUserProfile(supabase, user.id);
      if (row) {
        onSaved(mergeProfileRowWithAuthUser(row, authUser));
        return true;
      }
      setApplyMessage(t("profileForm.saveStateUnknown"));
      return false;
    } catch {
      setApplyMessage(t("profileForm.saveStateUnknown"));
      return false;
    }
  }, [user, supabaseConfigured, nickname, profileForForm, onSaved, t]);

  const saveSocialLinks = useCallback(async (): Promise<boolean> => {
    if (!user || !supabaseConfigured || !socialLinksReady) return true;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setApplyMessage(t("profileForm.supabaseCheck"));
      return false;
    }

    const normalized = normalizeSellerSocialLinksInput(socialLinks);
    const snap = JSON.stringify(normalized);
    if (socialSnapshotRef.current === snap) return true;

    const ok = await upsertUserDataBlob(
      supabase,
      user.id,
      SOCIAL_LINKS_BLOB_KEY,
      normalized,
    );
    if (!ok) {
      setApplyMessage(t("profileForm.socialSaveFailed"));
      return false;
    }
    socialSnapshotRef.current = snap;
    window.dispatchEvent(
      new CustomEvent("seller-social-links-updated", {
        detail: { sellerId: user.id, links: normalized },
      }),
    );
    return true;
  }, [socialLinks, socialLinksReady, supabaseConfigured, user, t]);

  const isDirty = useMemo(() => {
    const nickDirty = nz(nickname) !== nz(profileForForm?.nickname ?? "");
    const avatarDirty = !profileAvatarEqual(draftAvatar, profileAvatar);
    const socialDirty =
      socialLinksReady &&
      JSON.stringify(normalizeSellerSocialLinksInput(socialLinks)) !==
        socialSnapshotRef.current;
    return nickDirty || avatarDirty || socialDirty;
  }, [
    draftAvatar,
    nickname,
    profileAvatar,
    profileForForm?.nickname,
    socialLinks,
    socialLinksReady,
  ]);

  useEffect(() => {
    if (!isDirty) return;
    setApplyMessage(null);
    setApplySucceeded(false);
  }, [draftAvatar, isDirty, nickname, socialLinks]);

  const handleApply = useCallback(async () => {
    if (!isDirty || applyBusy) return;
    setApplyMessage(null);
    setApplySucceeded(false);
    setApplyBusy(true);
    try {
      const nickOk = await saveNickname();
      if (!nickOk) return;

      const socialOk = await saveSocialLinks();
      if (!socialOk) return;

      if (!profileAvatarEqual(draftAvatar, profileAvatar)) {
        if (!draftAvatar) {
          setApplyMessage(t("profileForm.saveStateUnknown"));
          return;
        }
        const result = await onProfileAvatarApply(draftAvatar);
        if (!result.ok) {
          if (draftAvatar.kind === "upload") {
            if (result.error === "bucket_missing") {
              window.alert(t("avatar.alertStorageNotReady"));
            } else {
              window.alert(t("avatar.alertSaveFail"));
            }
          }
          setApplyMessage(t("profileForm.saveStateUnknown"));
          return;
        }
      }

      setApplySucceeded(true);
      setApplyMessage(t("profileForm.applySuccess"));
    } finally {
      setApplyBusy(false);
    }
  }, [
    applyBusy,
    draftAvatar,
    isDirty,
    onProfileAvatarApply,
    profileAvatar,
    saveNickname,
    saveSocialLinks,
    t,
  ]);

  if (!user) {
    return (
      <p className="text-[15px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
        {t("profileForm.loginToEdit")}
      </p>
    );
  }

  const displayName = readGoogleLikeName(user);
  const providerLabel =
    user.app_metadata?.provider === "google" ? "Google 계정" : "연결 계정";
  const hasVisibleSocialLinks = socialLinks.some((link) => link.trim().length > 0);

  return (
    <div className="space-y-5">
      <section className={cardShell} aria-label={t("profileForm.loginAccount")}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
          <ProfileColorPicker
            className="min-w-0 flex-1"
            density="compact"
            value={draftAvatar}
            onChange={setDraftAvatar}
          />
          <div className="shrink-0 lg:ml-auto lg:min-w-[11rem] lg:pt-1 lg:text-right">
            <p className="text-[14px] font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
              {providerLabel}
            </p>
            <p className="mt-1 text-[19px] font-semibold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
              {displayName}
            </p>
            {user.email ? (
              <p className="mt-1 truncate text-[15px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                {user.email}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className={cardShell}>
        <label className="block text-[17px] font-semibold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
          {t("profileForm.nickname")}
          <input
            className={inputNickname}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoComplete="nickname"
          />
        </label>
      </section>

      <section className={cardShell} aria-labelledby="profile-sns-dashboard">
        <h3
          id="profile-sns-dashboard"
          className="text-[17px] font-semibold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
        >
          {t("profileForm.snsDashboardTitle")}
        </h3>
        <div className="mt-5">
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SNS_URL_PRESETS.map(({ prefix, label }) => (
              <button
                key={prefix}
                type="button"
                onClick={() => setSocialLinks((prev) => appendLinkWithPrefix(prev, prefix))}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2.5 text-[15px] font-semibold text-zinc-100 transition hover:border-white/28 hover:bg-white/[0.09] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:border-zinc-300"
              >
                <span className="text-[22px] leading-none font-bold text-[color:var(--reels-point)]">+</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {hasVisibleSocialLinks ? (
          <div className="mt-6">
            <div>
              <SocialLinkFields
                links={socialLinks}
                onChange={setSocialLinks}
                placeholder={t("profileForm.snsPlaceholder")}
              />
            </div>
          </div>
        ) : null}
      </section>

      <div className="pt-1">
        <button
          type="button"
          onClick={() => void handleApply()}
          disabled={!isDirty || applyBusy}
          className={applyBtnClass}
        >
          {applyBusy ? t("profileForm.applyBusy") : t("common.apply")}
        </button>
        {applyMessage ? (
          <p
            className={`mt-3 text-[15px] font-medium ${
              applySucceeded
                ? "text-[color:var(--reels-point)] [html[data-theme='light']_&]:text-reels-crimson"
                : "text-red-400 [html[data-theme='light']_&]:text-red-600"
            }`}
            role="status"
          >
            {applyMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
