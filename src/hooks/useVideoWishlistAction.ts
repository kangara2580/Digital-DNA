"use client";

import { useCallback } from "react";
import type { FeedVideo } from "@/data/videos";
import { useWishlist } from "@/context/WishlistContext";
import { logActionEvent } from "@/lib/observability";

export function useVideoWishlistAction(video: FeedVideo, requireAuth?: () => boolean) {
  const wishlist = useWishlist();
  const wishlisted = wishlist.isSaved(video.id);

  const toggleWishlist = useCallback(() => {
    if (requireAuth && !requireAuth()) return;
    logActionEvent({
      domain: "wishlist",
      action: wishlisted ? "remove" : "add",
      result: "ok",
      videoId: video.id,
      component: "useVideoWishlistAction",
      stage: "trigger",
    });
    wishlist.toggle(video);
  }, [requireAuth, video, wishlist, wishlisted]);

  return { wishlisted, toggleWishlist };
}

