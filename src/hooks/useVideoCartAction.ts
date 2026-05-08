"use client";

import { useCallback } from "react";
import type { FeedVideo } from "@/data/videos";
import { logActionEvent } from "@/lib/observability";

type CartController = {
  isVideoInCart: (videoId: string) => boolean;
  launchFromCartButton: (
    buttonEl: HTMLElement,
    video: FeedVideo,
    poster?: string,
  ) => void;
};

export function useVideoCartAction(
  video: FeedVideo,
  cart: CartController | null | undefined,
  requireAuth?: () => boolean,
) {
  const inCart = cart?.isVideoInCart(video.id) ?? false;
  const toggleCartFromButton = useCallback(
    (buttonEl: HTMLElement, poster?: string) => {
      if (!cart) return;
      if (requireAuth && !requireAuth()) return;
      logActionEvent({
        domain: "cart",
        action: inCart ? "remove" : "add",
        result: "ok",
        videoId: video.id,
        component: "useVideoCartAction",
        stage: "trigger",
      });
      cart.launchFromCartButton(buttonEl, video, poster);
    },
    [cart, requireAuth, video, inCart],
  );

  return { inCart, toggleCartFromButton };
}

