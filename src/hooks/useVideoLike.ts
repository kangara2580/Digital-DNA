"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { canonicalFavoriteVideoId } from "@/lib/favoriteVideoId";
import { captureActionError, logActionEvent } from "@/lib/observability";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

/** 같은 창의 좋아요 목록 등이 카드 하트와 동기화되도록 */
export const USER_FAVORITE_LIKE_UPDATED_EVENT = "ara-user-favorite-like-updated";

export type UserFavoriteLikeUpdatedDetail = {
  videoId: string;
  likedByMe: boolean;
};

function dispatchUserFavoriteLikeUpdated(videoId: string, likedByMe: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<UserFavoriteLikeUpdatedDetail>(USER_FAVORITE_LIKE_UPDATED_EVENT, {
      detail: { videoId, likedByMe },
    }),
  );
}

type UseVideoLikeOptions = {
  videoId: string;
  requireAuth: () => boolean;
  onError?: () => void;
};

export function useVideoLike({ videoId, requireAuth, onError }: UseVideoLikeOptions) {
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const [likedByMe, setLikedByMe] = useState(false);
  const [internalLikeCount, setInternalLikeCount] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);

  const loadLikeState = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const session = supabase ? await supabase.auth.getSession() : null;
      const token = session?.data.session?.access_token;
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await fetch(
        `/api/video/likes?videoId=${encodeURIComponent(canonicalFavoriteVideoId(videoId))}`,
        { cache: "no-store", headers },
      );
      if (!res.ok) return;
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        internalLikes?: number;
        likedByMe?: boolean;
      };
      if (!body.ok) return;
      setLikedByMe(Boolean(body.likedByMe));
      setInternalLikeCount(
        typeof body.internalLikes === "number" ? Math.max(0, body.internalLikes) : 0,
      );
    } catch (error) {
      captureActionError(error, {
        domain: "like",
        action: "load_like_state",
        result: "fail",
        videoId,
        userId: user?.id ?? null,
        component: "useVideoLike",
        stage: "read",
        errorCode: "load_failed",
      });
    }
  }, [videoId, user?.id]);

  useEffect(() => {
    setLikedByMe(false);
    setInternalLikeCount(0);
    if (authLoading || !user || !supabaseConfigured) return;
    void loadLikeState();
  }, [authLoading, loadLikeState, supabaseConfigured, user, videoId]);

  const toggleLike = useCallback(async () => {
    if (likeBusy || authLoading) return;
    if (!requireAuth()) return;
    const nextLiked = !likedByMe;
    const prevLiked = likedByMe;
    const prevCount = internalLikeCount;
    const canon = canonicalFavoriteVideoId(videoId);
    setLikedByMe(nextLiked);
    setInternalLikeCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));
    dispatchUserFavoriteLikeUpdated(canon, nextLiked);
    setLikeBusy(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const session = supabase ? await supabase.auth.getSession() : null;
      const token = session?.data.session?.access_token;
      if (!token) throw new Error("no_token");
      const res = await fetch("/api/video/likes", {
        method: nextLiked ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videoId: canonicalFavoriteVideoId(videoId) }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        internalLikes?: number;
        likedByMe?: boolean;
      };
      if (!res.ok || !body.ok) throw new Error("like_toggle_failed");
      if (typeof body.internalLikes === "number") {
        setInternalLikeCount(Math.max(0, body.internalLikes));
      }
      const serverLiked = Boolean(body.likedByMe);
      setLikedByMe(serverLiked);
      if (serverLiked !== nextLiked) {
        dispatchUserFavoriteLikeUpdated(canon, serverLiked);
      }
      logActionEvent({
        domain: "like",
        action: nextLiked ? "like" : "unlike",
        result: "ok",
        videoId,
        userId: user?.id ?? null,
        component: "useVideoLike",
        stage: "write",
      });
    } catch {
      setLikedByMe(prevLiked);
      setInternalLikeCount(prevCount);
      dispatchUserFavoriteLikeUpdated(canon, prevLiked);
      void loadLikeState();
      captureActionError(new Error("like_toggle_failed"), {
        domain: "like",
        action: nextLiked ? "like" : "unlike",
        result: "fail",
        videoId,
        userId: user?.id ?? null,
        component: "useVideoLike",
        stage: "write",
        errorCode: "toggle_failed",
      });
      onError?.();
    } finally {
      setLikeBusy(false);
    }
  }, [
    authLoading,
    internalLikeCount,
    likeBusy,
    likedByMe,
    loadLikeState,
    onError,
    requireAuth,
    user?.id,
    videoId,
  ]);

  return { likedByMe, likeBusy, internalLikeCount, toggleLike, loadLikeState };
}

