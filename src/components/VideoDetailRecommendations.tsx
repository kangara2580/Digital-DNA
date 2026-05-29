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

/** 상세 하단: 판매자 피드 프로필 + 판매자의 다른 영상 그리드 */
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
  }, [sellerId, video.id]);

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

  const allSellerVideos = useMemo(() => {
    if (dbVideos.length > 0) return dbVideos;
    return catalogPool;
  }, [dbVideos, catalogPool]);

  const listingVideos = useMemo(() => {
    const others = allSellerVideos.filter((v) => v.id !== video.id);
    return others.length > 0 ? others : allSellerVideos;
  }, [allSellerVideos, video.id]);

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
  const hasSellerFeed = Boolean(sellerId) || catalogPool.length > 0;

  if (!hasSellerFeed) {
    return null;
  }

  if (loading) {
    return (
      <section className="mt-10 w-full sm:mt-12" aria-labelledby="video-reco-heading">
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

  if (allSellerVideos.length === 0 && listingVideos.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 w-full sm:mt-12" aria-labelledby="video-reco-heading">
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
          videoCount={allSellerVideos.length}
          isDbSeller={isDbSeller}
          profileBio={profileBio}
          profileColor={profileColor}
          profileUploadUrl={profileUploadUrl}
          sellerSocialLinks={sellerSocialLinks}
        />
      </div>

      {listingVideos.length > 0 ? (
        <section className="mt-8 sm:mt-10" aria-labelledby="video-reco-listings-heading">
          <h3
            id="video-reco-listings-heading"
            className="mb-4 text-center text-base font-extrabold tracking-tight text-zinc-200 [html[data-theme='light']_&]:text-zinc-800"
          >
            {t("video.reco.listingsHeading")}
          </h3>
          <SellerFeedListingsGrid
            sellerId={sellerKey}
            isDbSeller={isDbSeller}
            initialVideos={listingVideos}
            initialMetricsByVideoId={{}}
            detailHrefSuffix={feedHrefSuffix}
          />
        </section>
      ) : null}
    </section>
  );
}
