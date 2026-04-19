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
import {
  readGuestCartVideos,
  writeGuestCartVideos,
} from "@/lib/guestListStorage";
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
  /** 서버 초기 장바구니 로드 완료 전에는 담기 막음(빈 fetch가 로컬 담기를 덮는 레이스 방지) */
  cartSyncReady: boolean;
  launchFromCartButton: (
    buttonEl: HTMLElement,
    video: FeedVideo,
    poster?: string,
  ) => void;
  builderItems: BuilderTimelineItem[];
  removeBuilderItem: (key: string) => void;
  removeBuilderItemsByKeys: (keys: string[]) => void;
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
  const [cartSyncReady, setCartSyncReady] = useState(false);
  const builderSeq = useRef(0);
  const flySeq = useRef(0);
  const restoreGuardRef = useRef(false);
  const lastGoodCartRef = useRef<BuilderTimelineItem[]>([]);
  const cartFetchGenRef = useRef(0);
  /** 서버 초기 로드가 끝나기 전에는 빈 목록으로 replaceUserCart가 호출되면 안 됨 */
  const cartInitialFetchDoneRef = useRef(false);
  /**
   * 서버에서 장바구니를 성공적으로 읽은 뒤에만 DB에 반영. 토큰 지연·fetch 실패 직후 빈 배열로
   * replaceUserCart 가 돌면 서버 장바구니가 통째로 삭제되던 문제 방지.
   */
  const maySyncCartToServerRef = useRef(false);

  const removeFly = useCallback((id: string) => {
    setFlyItems((items) => items.filter((x) => x.id !== id));
  }, []);

  const launchFromCartButton = useCallback(
    (buttonEl: HTMLElement, video: FeedVideo, poster?: string) => {
      if (typeof window === "undefined") return;
      const isGuest = !supabaseConfigured || !userId;
      if (!isGuest && !cartSyncReady) {
        window.alert("장바구니를 불러오는 중입니다. 잠시 후 다시 눌러 주세요.");
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
    [supabaseConfigured, userId, cartSyncReady],
  );

  const removeBuilderItem = useCallback((key: string) => {
    setBuilderItems((items) => items.filter((x) => x.key !== key));
  }, []);

  const removeBuilderItemsByKeys = useCallback((keys: string[]) => {
    const set = new Set(keys);
    setBuilderItems((items) => items.filter((x) => !set.has(x.key)));
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
      maySyncCartToServerRef.current = false;
      cartInitialFetchDoneRef.current = true;
      setCartSyncReady(true);
      const guestVideos = readGuestCartVideos();
      const guestItems = videosToBuilderItems(guestVideos);
      lastGoodCartRef.current = guestItems;
      setBuilderItems(guestItems);
      setHydrated(true);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      maySyncCartToServerRef.current = false;
      cartInitialFetchDoneRef.current = true;
      setCartSyncReady(true);
      setHydrated(true);
      return;
    }

    const gen = ++cartFetchGenRef.current;
    let cancelled = false;
    maySyncCartToServerRef.current = false;
    restoreGuardRef.current = true;
    cartInitialFetchDoneRef.current = false;
    setCartSyncReady(false);
    /** 서버에서 장바구니를 불러오기 전에는 동기화 이펙트가 빈 배열로 DB를 덮어쓰면 안 됨 */
    setHydrated(false);

    void (async () => {
      const tokenReady = await waitForSupabaseAccessToken(supabase);
      if (cancelled || gen !== cartFetchGenRef.current) return;
      if (!tokenReady) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[cart] initial fetch skipped — session token not ready");
        }
        /** 토큰 없이 hydrated 만 올리면 동기화 이펙트가 빈 장바구니로 서버를 지움 → 로드 성공 전까지 쓰기 금지 */
        restoreGuardRef.current = false;
        cartInitialFetchDoneRef.current = false;
        maySyncCartToServerRef.current = false;
        setCartSyncReady(false);
        setHydrated(false);
        return;
      }

      const result = await fetchUserCartVideos(supabase, userId);
      if (cancelled || gen !== cartFetchGenRef.current) return;

      if (result.ok) {
        maySyncCartToServerRef.current = true;
        const items = videosToBuilderItems(result.videos);
        lastGoodCartRef.current = items;
        /** 서버가 비어 있으면 로컬 담기를 덮어쓰지 않음(초기 레이스 방지) */
        setBuilderItems((prev) => (items.length > 0 ? items : prev));
      } else {
        if (process.env.NODE_ENV === "development") {
          console.warn("[cart] fetch failed — keeping previous items", result.errorMessage);
        }
        /** 읽기 실패 시 서버 내용을 모름 — 빈 상태로 DB 덮어쓰기 금지 */
        maySyncCartToServerRef.current = false;
        setBuilderItems((prev) =>
          prev.length > 0 ? prev : lastGoodCartRef.current,
        );
      }
      restoreGuardRef.current = false;
      cartInitialFetchDoneRef.current = true;
      setCartSyncReady(true);
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, supabaseConfigured, userId, session?.access_token]);

  useEffect(() => {
    if (!hydrated || authLoading) return;
    if (!cartInitialFetchDoneRef.current) return;
    if (!maySyncCartToServerRef.current) return;
    if (restoreGuardRef.current) return;
    if (!supabaseConfigured || !userId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const videos = builderItems.map((b) => b.video);
    const handle = window.setTimeout(() => {
      void (async () => {
        const ok = await waitForSupabaseAccessToken(supabase);
        if (!ok) return;
        await replaceUserCart(supabase, userId, videos);
      })();
    }, 420);
    return () => window.clearTimeout(handle);
  }, [builderItems, hydrated, authLoading, supabaseConfigured, userId]);

  useEffect(() => {
    if (authLoading) return;
    if (supabaseConfigured && userId) return;
    if (!hydrated) return;
    writeGuestCartVideos(builderItems.map((b) => b.video));
  }, [builderItems, authLoading, supabaseConfigured, userId, hydrated]);

  const cartCount = builderItems.length;

  const value = useMemo(
    () => ({
      cartAnchorRef,
      cartCount,
      cartSyncReady,
      launchFromCartButton,
      builderItems,
      removeBuilderItem,
      removeBuilderItemsByKeys,
      clearBuilder,
    }),
    [
      cartCount,
      cartSyncReady,
      launchFromCartButton,
      builderItems,
      removeBuilderItem,
      removeBuilderItemsByKeys,
      clearBuilder,
    ],
  );

  return (
    <DopamineBasketContext.Provider value={value}>
      {children}
      <CartThumbnailFlyLayer items={flyItems} onRemove={removeFly} />
    </DopamineBasketContext.Provider>
  );
}
