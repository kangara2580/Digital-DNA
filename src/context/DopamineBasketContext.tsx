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

const FALLBACK_FLY_POSTER =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const GUEST_CART_KEY = "digital-dna-cart-guest-v1";

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

function loadGuestCartVideos(): FeedVideo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is FeedVideo =>
        v != null &&
        typeof v === "object" &&
        typeof (v as FeedVideo).id === "string",
    ) as FeedVideo[];
  } catch {
    return [];
  }
}

function saveGuestCartVideos(videos: FeedVideo[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(videos));
  } catch {
    /* quota */
  }
}

function mergeCartVideos(server: FeedVideo[], guest: FeedVideo[]): FeedVideo[] {
  const seen = new Set<string>();
  const out: FeedVideo[] = [];
  for (const v of server) {
    if (seen.has(v.id)) continue;
    seen.add(v.id);
    out.push(v);
  }
  for (const v of guest) {
    if (seen.has(v.id)) continue;
    seen.add(v.id);
    out.push(v);
  }
  return out;
}

function videosToBuilderItems(videos: FeedVideo[]): BuilderTimelineItem[] {
  return videos.map((video, i) => ({
    key: `b-load-${video.id}-${i}`,
    video,
  }));
}

export function DopamineBasketProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const cartAnchorRef = useRef<HTMLAnchorElement | null>(null);
  const [builderItems, setBuilderItems] = useState<BuilderTimelineItem[]>([]);
  const [flyItems, setFlyItems] = useState<CartFlyItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const builderSeq = useRef(0);
  const flySeq = useRef(0);
  const restoreGuardRef = useRef(false);

  const removeFly = useCallback((id: string) => {
    setFlyItems((items) => items.filter((x) => x.id !== id));
  }, []);

  const launchFromCartButton = useCallback(
    (buttonEl: HTMLElement, video: FeedVideo, poster?: string) => {
      if (typeof window === "undefined") return;
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
    [],
  );

  const removeBuilderItem = useCallback((key: string) => {
    setBuilderItems((items) => items.filter((x) => x.key !== key));
  }, []);

  const clearBuilder = useCallback(() => {
    setBuilderItems([]);
  }, []);

  useEffect(() => {
    if (authLoading) {
      setHydrated(false);
      return;
    }

    let cancelled = false;
    restoreGuardRef.current = true;

    void (async () => {
      if (!supabaseConfigured) {
        const guest = loadGuestCartVideos();
        if (!cancelled) {
          setBuilderItems(videosToBuilderItems(guest));
          setHydrated(true);
        }
        restoreGuardRef.current = false;
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!user || !supabase) {
        const guest = loadGuestCartVideos();
        if (!cancelled) {
          setBuilderItems(videosToBuilderItems(guest));
          setHydrated(true);
        }
        restoreGuardRef.current = false;
        return;
      }

      const server = await fetchUserCartVideos(supabase, user.id);
      if (cancelled) return;
      const guest = loadGuestCartVideos();
      const merged = mergeCartVideos(server, guest);
      if (guest.length > 0) {
        saveGuestCartVideos([]);
        await replaceUserCart(supabase, user.id, merged);
      }
      if (!cancelled) {
        setBuilderItems(videosToBuilderItems(merged));
        setHydrated(true);
      }
      restoreGuardRef.current = false;
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, supabaseConfigured, user]);

  useEffect(() => {
    if (!hydrated || authLoading) return;
    if (restoreGuardRef.current) return;

    const videos = builderItems.map((b) => b.video);
    const handle = window.setTimeout(() => {
      if (!supabaseConfigured) {
        saveGuestCartVideos(videos);
        return;
      }
      const supabase = getSupabaseBrowserClient();
      if (!user || !supabase) {
        saveGuestCartVideos(videos);
        return;
      }
      void replaceUserCart(supabase, user.id, videos);
    }, 420);

    return () => window.clearTimeout(handle);
  }, [builderItems, hydrated, authLoading, supabaseConfigured, user]);

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
