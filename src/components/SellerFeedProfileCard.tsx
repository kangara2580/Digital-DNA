"use client";

import { PencilLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProfileColorPicker } from "@/components/ProfileColorPicker";
import { SellerFeedListingCount } from "@/components/SellerFeedI18n";
import { SellerFeedSocialLinks } from "@/components/SellerFeedSocialLinks";
import { ProfileColorAvatar } from "@/components/ProfileColorAvatar";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTranslation } from "@/hooks/useTranslation";
import { MYPAGE_OUTLINE_BTN_CORE } from "@/lib/mypageOutlineCta";
import type { ProfileAvatar } from "@/lib/profileAvatarStorage";
import {
  profileAvatarToAuthMetaPatch,
  profileAvatarToDbPatch,
} from "@/lib/profileAvatarStorage";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { updateAuthUserSafe } from "@/lib/supabaseAuthSerialize";
import { upsertUserProfile } from "@/lib/supabaseProfiles";
import { normalizeProfileColorHex } from "@/lib/profileColorSpectrum";
import type { SellerSocialLink } from "@/lib/sellerSocialLinks";
import { isProbablySellerUserId } from "@/lib/sellerUserId";

type Props = {
  sellerId: string;
  nickname: string;
  videoCount: number;
  isDbSeller: boolean;
  profileBio: string | null;
  profileColor: string;
  profileUploadUrl: string | null;
  sellerSocialLinks?: SellerSocialLink[];
  titleAs?: "h1" | "h2";
};

function avatarFromProps(
  profileColor: string,
  profileUploadUrl: string | null,
): ProfileAvatar {
  if (profileUploadUrl?.trim()) {
    return { kind: "upload", dataUrl: profileUploadUrl.trim() };
  }
  const hex = normalizeProfileColorHex(profileColor);
  return { kind: "color", hex: hex ?? profileColor };
}

function displayUploadUrlFromAvatar(avatar: ProfileAvatar): string | null {
  if (avatar.kind === "upload") return avatar.dataUrl;
  return null;
}

function displayColorFromAvatar(avatar: ProfileAvatar, fallback: string): string {
  if (avatar.kind === "color") {
    return normalizeProfileColorHex(avatar.hex) ?? fallback;
  }
  return fallback;
}

/** `/seller/[handle]` 상단 프로필 카드 — 소유자는 닉네임·아바타·소개를 한 번에 수정 */
export function SellerFeedProfileCard({
  sellerId,
  nickname: initialNickname,
  videoCount,
  isDbSeller,
  profileBio: initialBio,
  profileColor: initialProfileColor,
  profileUploadUrl: initialUploadUrl,
  sellerSocialLinks = [],
  titleAs = "h2",
}: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthSession();
  const isOwner = user?.id === sellerId;
  const showSocialLinks = isProbablySellerUserId(sellerId);
  const TitleTag = titleAs;

  const [nickname, setNickname] = useState(initialNickname);
  const [bio, setBio] = useState(initialBio ?? "");
  const [profileAvatar, setProfileAvatar] = useState<ProfileAvatar>(() =>
    avatarFromProps(initialProfileColor, initialUploadUrl),
  );
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNickname(initialNickname);
    setBio(initialBio ?? "");
    setProfileAvatar(avatarFromProps(initialProfileColor, initialUploadUrl));
    setEditing(false);
  }, [
    sellerId,
    initialNickname,
    initialBio,
    initialProfileColor,
    initialUploadUrl,
  ]);

  const profileUploadUrl = displayUploadUrlFromAvatar(profileAvatar);
  const profileColor = displayColorFromAvatar(profileAvatar, initialProfileColor);

  const helpText = useMemo(() => {
    if (bio.trim()) return bio;
    return t("seller.bio.emptyVisitor");
  }, [bio, t]);

  const cancelEdit = useCallback(() => {
    setNickname(initialNickname);
    setBio(initialBio ?? "");
    setProfileAvatar(avatarFromProps(initialProfileColor, initialUploadUrl));
    setEditing(false);
  }, [initialBio, initialNickname, initialProfileColor, initialUploadUrl]);

  const saveAll = useCallback(async () => {
    if (!isOwner || saving) return;
    setSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const session = supabase ? await supabase.auth.getSession() : null;
      const token = session?.data.session?.access_token;
      if (!token) {
        window.alert(t("seller.bio.loginAlert"));
        return;
      }

      let resolvedAvatar = profileAvatar;

      if (
        profileAvatar.kind === "upload" &&
        profileAvatar.dataUrl.startsWith("data:image/")
      ) {
        const uploadRes = await fetch("/api/profile/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ dataUrl: profileAvatar.dataUrl }),
        });
        const uploadBody = (await uploadRes.json().catch(() => ({}))) as {
          ok?: boolean;
          url?: string;
        };
        if (!uploadRes.ok || !uploadBody.ok || !uploadBody.url) {
          window.alert(t("seller.feed.profileSaveFail"));
          return;
        }
        resolvedAvatar = { kind: "upload", dataUrl: uploadBody.url };
      } else if (profileAvatar.kind === "color" && supabase && user) {
        const dbPatch = profileAvatarToDbPatch(profileAvatar);
        const upserted = await upsertUserProfile(supabase, user.id, dbPatch);
        if (!upserted) {
          window.alert(t("seller.feed.profileSaveFail"));
          return;
        }
        const { error: authErr } = await updateAuthUserSafe(supabase, {
          data: profileAvatarToAuthMetaPatch(profileAvatar),
        });
        if (authErr) {
          window.alert(t("seller.feed.profileSaveFail"));
          return;
        }
      }

      const res = await fetch("/api/sellers/feed-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sellerBio: bio,
          nickname: nickname.trim(),
          avatarKind: resolvedAvatar.kind === "color" ? "color" : "upload",
          avatarSeed: resolvedAvatar.kind === "color" ? resolvedAvatar.hex : null,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        nickname?: string | null;
        sellerBio?: string | null;
        profileColor?: string;
        profileUploadUrl?: string | null;
      };
      if (!res.ok || !body.ok) {
        window.alert(t("seller.feed.profileSaveFail"));
        return;
      }

      if (body.nickname?.trim()) setNickname(body.nickname.trim());
      if (body.sellerBio != null) setBio(body.sellerBio);
      if (body.profileUploadUrl) {
        setProfileAvatar({ kind: "upload", dataUrl: body.profileUploadUrl });
      } else if (body.profileColor) {
        setProfileAvatar({ kind: "color", hex: body.profileColor });
      } else {
        setProfileAvatar(resolvedAvatar);
      }

      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }, [
    bio,
    isOwner,
    nickname,
    profileAvatar,
    router,
    saving,
    t,
    user,
  ]);

  return (
    <section className="relative overflow-hidden rounded-[1.35rem] border border-white/[0.1] bg-[var(--background)] p-5 shadow-none sm:rounded-[1.65rem] sm:p-7 [html[data-theme='light']_&]:border-zinc-200/70 [html[data-theme='light']_&]:bg-gradient-to-br [html[data-theme='light']_&]:from-white [html[data-theme='light']_&]:via-white [html[data-theme='light']_&]:to-zinc-50/90 [html[data-theme='light']_&]:shadow-[0_20px_50px_-28px_rgba(15,23,42,0.18),0_0_0_1px_rgba(255,45,141,0.07)] [html[data-theme='light']_&]:backdrop-blur-xl">
      <div
        className="pointer-events-none absolute -left-24 -top-24 hidden h-48 w-48 rounded-full bg-[color:var(--reels-point)]/12 blur-[80px] [html[data-theme='light']_&]:block"
        aria-hidden
      />

      {isOwner ? (
        <div className="relative z-10 mb-1 flex justify-end sm:absolute sm:right-5 sm:top-5 sm:mb-0">
          {editing ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className={`${MYPAGE_OUTLINE_BTN_CORE} px-3 py-1.5 text-[12px] disabled:opacity-50`}
              >
                {t("seller.feed.editCancel")}
              </button>
              <button
                type="button"
                onClick={() => void saveAll()}
                disabled={saving}
                className={`${MYPAGE_OUTLINE_BTN_CORE} border-[color:var(--reels-point)]/45 px-3 py-1.5 text-[12px] text-[color:var(--reels-point)] disabled:opacity-50`}
              >
                {saving ? t("seller.bio.saving") : t("seller.bio.save")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/18 bg-transparent text-white/75 transition hover:border-[color:var(--reels-point)]/45 hover:bg-[color:var(--reels-point)]/10 hover:text-[color:var(--reels-point)] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:border-[color:var(--reels-point)]/40"
              aria-label={t("seller.feed.editProfileLabel")}
              title={t("seller.feed.editProfileLabel")}
            >
              <PencilLine className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      ) : null}

      <div className="relative grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          {editing && isOwner ? (
            <ProfileColorPicker
              className="min-w-0 shrink-0"
              density="compact"
              value={profileAvatar}
              onChange={setProfileAvatar}
            />
          ) : (
            <div className="relative shrink-0">
              <div
                className="absolute inset-0 hidden rounded-full bg-[color:var(--reels-point)]/15 blur-lg [html[data-theme='light']_&]:block"
                aria-hidden
              />
              {profileUploadUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileUploadUrl}
                  alt=""
                  className="relative h-[4.25rem] w-[4.25rem] rounded-full object-cover ring-2 ring-white/20 ring-offset-2 ring-offset-[var(--background)] sm:h-[4.75rem] sm:w-[4.75rem] [html[data-theme='light']_&]:ring-zinc-200/80 [html[data-theme='light']_&]:ring-offset-white"
                />
              ) : (
                <ProfileColorAvatar
                  hex={profileColor}
                  initial={nickname.slice(0, 1).toUpperCase()}
                  sizeClass="relative h-[4.25rem] w-[4.25rem] sm:h-[4.75rem] sm:w-[4.75rem]"
                  className="ring-2 ring-white/20 ring-offset-2 ring-offset-[var(--background)] [html[data-theme='light']_&]:ring-zinc-200/80 [html[data-theme='light']_&]:ring-offset-white"
                  label={`${nickname} 프로필`}
                />
              )}
            </div>
          )}

          <div className="min-w-0 flex-1">
            {editing && isOwner ? (
              <label className="block">
                <span className="sr-only">{t("profileForm.nickname")}</span>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.slice(0, 32))}
                  className="w-full rounded-xl border border-white/14 bg-black/25 px-3 py-2.5 text-xl font-extrabold tracking-tight text-zinc-100 outline-none transition focus:border-[color:var(--reels-point)]/45 focus:ring-1 focus:ring-[color:var(--reels-point)]/35 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
                  autoComplete="nickname"
                />
              </label>
            ) : (
              <TitleTag className="truncate text-2xl font-extrabold tracking-tight sm:text-[1.85rem] sm:leading-tight">
                {nickname}
              </TitleTag>
            )}
            <SellerFeedListingCount videoCount={videoCount} isDbSeller={isDbSeller} />
            {showSocialLinks && !editing ? (
              <SellerFeedSocialLinks
                sellerId={sellerId}
                initialLinks={sellerSocialLinks}
              />
            ) : null}
          </div>
        </div>

        <div className="min-w-0 border-t border-white/[0.1] pt-6 lg:border-t-0 lg:border-l lg:border-white/[0.1] lg:pl-8 lg:pt-0 [html[data-theme='light']_&]:border-zinc-200/75">
          <div className="w-full max-w-2xl">
            {editing && isOwner ? (
              <div className="mt-0 lg:mt-8">
                <label className="mb-2 block text-[12px] font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                  {t("seller.bio.placeholder")}
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 240))}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/14 bg-black/35 px-3.5 py-2.5 text-[13px] leading-relaxed text-white/[0.95] outline-none ring-0 transition placeholder:text-white/35 focus:border-[color:var(--reels-point)]/45 focus:ring-1 focus:ring-[color:var(--reels-point)]/35 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:placeholder:text-zinc-400"
                  placeholder={t("seller.bio.placeholder")}
                />
                <p className="mt-2 text-[11px] font-medium text-white/40 [html[data-theme='light']_&]:text-zinc-500">
                  {bio.trim().length}/240
                </p>
              </div>
            ) : (
              <p className="mt-2.5 min-h-[3.25rem] whitespace-pre-wrap text-[13px] leading-relaxed text-white/[0.78] [html[data-theme='light']_&]:text-zinc-700 lg:mt-0">
                {helpText}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
