"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CartThumbnailFlyLayer,
  type CartFlyItem,
  rectFromEl,
} from "@/components/CartThumbnailFly";
import type { FeedVideo } from "@/data/videos";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  fetchUserCartVideos,
  replaceUserCart,
} from "@/lib/supabaseUserSync";
import { sanitizePosterSrc } from "@/lib/videoPoster";
import { waitForSupabaseAccessToken } from "@/lib/waitSupabaseSessionReady";

const FALLBACK_FLY_POSTER =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

export type BuilderTimelineItem = {
  key: string;
  video: FeedVideo;
};

type Ctx = {
  cartAnchorRef: React.RefObject<HTMLAnchorElement | null>;
  cartCount: number;
  launchFromCartButton: (
    buttonEl: HTMLElement,
    video: FeedVideo,
    poster?: string,
  ) => void;
  builderItems: BuilderTimelineItem[];
  removeBuilderItem: (key: string) => void;
  clearBuilder: () => void;
};

const DopamineBasketContext = createContext<Ctx | null>(null);

export function useDopamineBasket() {
  const c = useContext(DopamineBasketContext);
  if (!c) {
    throw new Error("useDopamineBasket must be used within DopamineBasketProvider");
  }
  return c;
}

export function useDopamineBasketOptional() {
  return useContext(DopamineBasketContext);
}

function videosToBuilderItems(videos: FeedVideo[]): BuilderTimelineItem[] {
  return videos.map((video, i) => ({
    key: `b-load-${video.id}-${i}`,
    video,
  }));
}

export function DopamineBasketProvider({ children }: { children: React.ReactNode }) {
  const {
    user,
    session,
    loading: authLoading,
    supabaseConfigured,
  } = useAuthSession();
  const userId = user?.id ?? null;
  const cartAnchorRef = useRef<HTMLAnchorElement | null>(null);
  const [builderItems, setBuilderItems] = useState<BuilderTimelineItem[]>([]);
  const [flyItems, setFlyItems] = useState<CartFlyItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const builderSeq = useRef(0);
  const flySeq = useRef(0);
  const restoreGuardRef = useRef(false);
  const lastGoodCartRef = useRef<BuilderTimelineItem[]>([]);
  const cartFetchGenRef = useRef(0);

  const removeFly = useCallback((id: string) => {
    setFlyItems((items) => items.filter((x) => x.id !== id));
  }, []);

  const launchFromCartButton = useCallback(
    (buttonEl: HTMLElement, video: FeedVideo, poster?: string) => {
      if (typeof window === "undefined") return;
      if (!supabaseConfigured || !userId) {
        window.alert("로그인 후 장바구니를 사용할 수 있습니다.");
        return;
      }
      const key = `b-${video.id}-${++builderSeq.current}`;
      setBuilderItems((items) => [...items, { key, video }]);

      const cartEl = cartAnchorRef.current;
      if (!cartEl) return;

      const from = rectFromEl(buttonEl);
      const to = rectFromEl(cartEl);
      if (from.width < 4 || from.height < 4 || to.width < 2) return;

      const id = `fly-${++flySeq.current}-${Date.now()}`;
      setFlyItems((items) => [
        ...items,
        {
          id,
          poster:
            sanitizePosterSrc(poster) ??
            sanitizePosterSrc(video.poster) ??
            FALLBACK_FLY_POSTER,
          from,
          to,
        },
      ]);
    },
    [supabaseConfigured, userId],
  );

  const removeBuilderItem = useCallback((key: string) => {
    setBuilderItems((items) => items.filter((x) => x.key !== key));
  }, []);

  const clearBuilder = useCallback(() => {
    setBuilderItems([]);
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!supabaseConfigured || !userId) {
      cartFetchGenRef.current += 1;
      setBuilderItems([]);
      lastGoodCartRef.current = [];
      setHydrated(true);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setHydrated(true);
      return;
    }

    const gen = ++cartFetchGenRef.current;
    let cancelled = false;
    restoreGuardRef.current = true;

    void (async () => {
      const tokenReady = await waitForSupabaseAccessToken(supabase);
      if (cancelled || gen !== cartFetchGenRef.current) return;
      if (!tokenReady) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[cart] initial fetch skipped — session token not ready");
        }
        restoreGuardRef.current = false;
        setHydrated(true);
        return;
      }

      const result = await fetchUserCartVideos(supabase, userId);
      if (cancelled || gen !== cartFetchGenRef.current) return;

      if (result.ok) {
        const items = videosToBuilderItems(result.videos);
        lastGoodCartRef.current = items;
        setBuilderItems(items);
      } else {
        if (process.env.NODE_ENV === "development") {
          console.warn("[cart] fetch failed — keeping previous items", result.errorMessage);
        }
        setBuilderItems((prev) =>
          prev.length > 0 ? prev : lastGoodCartRef.current,
        );
      }
      restoreGuardRef.current = false;
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, supabaseConfigured, userId, session?.access_token]);

  useEffect(() => {
    if (!hydrated || authLoading) return;
    if (restoreGuardRef.current) return;
    if (!supabaseConfigured || !userId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const videos = builderItems.map((b) => b.video);
    const handle = window.setTimeout(() => {
      void replaceUserCart(supabase, userId, videos);
    }, 420);
    return () => window.clearTimeout(handle);
  }, [builderItems, hydrated, authLoading, supabaseConfigured, userId]);

  const cartCount = builderItems.length;

  const value = useMemo(
    () => ({
      cartAnchorRef,
      cartCount,
      launchFromCartButton,
      builderItems,
      removeBuilderItem,
      clearBuilder,
    }),
    [cartCount, launchFromCartButton, builderItems, removeBuilderItem, clearBuilder],
  );

  return (
    <DopamineBasketContext.Provider value={value}>
      {children}
      <CartThumbnailFlyLayer items={flyItems} onRemove={removeFly} />
    </DopamineBasketContext.Provider>
  );
}
