"use client";

import { useEffect, useMemo, useState } from "react";
import { SellerFeedProfileCard } from "@/components/SellerFeedProfileCard";
import { SellerFeedListingsGrid } from "@/components/SellerFeedListingsGrid";
import {
  getSellerNickname,
  getVideosBySellerHandle,
  normalizeSellerHandle,
} from "@/data/videoCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import {
  sellerHandleFromVideo,
  sellerProfileColorFromRecord,
  sellerProfileColorFromVideo,
} from "@/lib/sellerProfile";
import { isProbablySellerUserId } from "@/lib/sellerUserId";
import type { SellerSocialLink } from "@/lib/sellerSocialLinks";
import type { FeedVideo } from "@/data/videos";

type Props = {
  video: FeedVideo;
  /** 상세 이전/다음·판매자 피드와 동일한 쿼리 (`?fromSeller=` 등) */
  detailHrefSuffix?: string;
};

type FeedProfilePayload = {
  nickname: string | null;
  sellerBio: string | null;
  profileColor: string;
  profileUploadUrl: string | null;
  sellerSocialLinks: SellerSocialLink[];
};

/** 상세 하단: `/seller` 와 동일한 프로필 카드 + 판매 목록 그리드 */
export function VideoDetailRecommendations({
  video,
  detailHrefSuffix = "",
}: Props) {
  const { t } = useTranslation();
  const sellerKey = sellerHandleFromVideo(video);
  const sellerId = video.listing?.sellerId?.trim();

  const catalogPool = useMemo(() => {
    const handle = normalizeSellerHandle(video.creator);
    return getVideosBySellerHandle(handle);
  }, [video.creator]);

  const [dbVideos, setDbVideos] = useState<FeedVideo[]>([]);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [feedProfile, setFeedProfile] = useState<FeedProfilePayload | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    setDbVideos([]);
    setDbLoaded(false);
    if (!sellerId) {
      setDbLoaded(true);
      return;
    }
    let alive = true;
    void fetch(`/api/seller/videos?sellerId=${encodeURIComponent(sellerId)}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { ok?: boolean; videos?: FeedVideo[] } | null) => {
        if (!alive) return;
        if (data?.ok && Array.isArray(data.videos)) {
          setDbVideos(data.videos);
        }
        setDbLoaded(true);
      })
      .catch(() => {
        if (alive) setDbLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [sellerId]);

  useEffect(() => {
    setFeedProfile(null);
    setProfileLoaded(false);
    if (!isProbablySellerUserId(sellerKey)) {
      setProfileLoaded(true);
      return;
    }
    let alive = true;
    void fetch(`/api/sellers/feed-profile?sellerId=${encodeURIComponent(sellerKey)}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          data: {
            ok?: boolean;
            nickname?: string | null;
            sellerBio?: string | null;
            profileColor?: string;
            profileUploadUrl?: string | null;
            sellerSocialLinks?: SellerSocialLink[];
          } | null,
        ) => {
          if (!alive) return;
          if (data?.ok) {
            setFeedProfile({
              nickname: data.nickname ?? null,
              sellerBio: data.sellerBio ?? null,
              profileColor:
                data.profileColor ?? sellerProfileColorFromVideo(video),
              profileUploadUrl: data.profileUploadUrl ?? null,
              sellerSocialLinks: data.sellerSocialLinks ?? [],
            });
          }
          setProfileLoaded(true);
        },
      )
      .catch(() => {
        if (alive) setProfileLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [sellerKey, video]);

  const feedVideos = useMemo(() => {
    if (dbVideos.length > 0) return dbVideos;
    return catalogPool;
  }, [dbVideos, catalogPool]);

  const isDbSeller = dbVideos.length > 0;
  const feedHrefSuffix =
    detailHrefSuffix || `?fromSeller=${encodeURIComponent(sellerKey)}`;

  const nickname =
    feedProfile?.nickname ||
    getSellerNickname(video.creator) ||
    sellerKey.slice(0, 8);

  const profileColor =
    feedProfile?.profileColor ??
    sellerProfileColorFromRecord(
      {
        user_id: sellerKey,
        avatar_kind: null,
        avatar_seed: null,
      },
      sellerKey,
    );

  const profileUploadUrl = feedProfile?.profileUploadUrl ?? null;
  const profileBio = feedProfile?.sellerBio ?? null;
  const sellerSocialLinks =
    feedProfile?.sellerSocialLinks ?? video.sellerSocialLinks ?? [];

  const loading = (!dbLoaded && Boolean(sellerId)) || !profileLoaded;

  if (loading) {
    return (
      <section className="mt-10 sm:mt-12" aria-labelledby="video-reco-heading">
        <h2
          id="video-reco-heading"
          className="text-center text-xl font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
        >
          {t("video.reco.heading")}
        </h2>
        <div className="mt-8 flex justify-center py-12" aria-busy="true" aria-label={t("common.loading")} />
      </section>
    );
  }

  if (feedVideos.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 sm:mt-12" aria-labelledby="video-reco-heading">
      <h2
        id="video-reco-heading"
        className="text-center text-xl font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
      >
        {t("video.reco.heading")}
      </h2>

      <div className="mt-6 sm:mt-8">
        <SellerFeedProfileCard
          sellerId={sellerKey}
          nickname={nickname}
          videoCount={feedVideos.length}
          isDbSeller={isDbSeller}
          profileBio={profileBio}
          profileColor={profileColor}
          profileUploadUrl={profileUploadUrl}
          sellerSocialLinks={sellerSocialLinks}
        />
      </div>

      <section className="mt-8 sm:mt-10">
        <SellerFeedListingsGrid
          sellerId={sellerKey}
          isDbSeller={isDbSeller}
          initialVideos={feedVideos}
          initialMetricsByVideoId={{}}
          detailHrefSuffix={feedHrefSuffix}
        />
      </section>
    </section>
  );
}
