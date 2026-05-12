"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { FeedVideo } from "@/data/videos";
import { useAuthSession } from "@/hooks/useAuthSession";

export type PurchasedListItem = {
  videoId: string;
  /** 결제 시점 금액(원). 유료 결제 기록이 없으면 목록가와 동일하게 둡니다. */
  paidPriceWon: number;
  listPriceWon: number;
  /** 마켓에서 신규 구매 가능 여부(승인된 판매 목록 또는 카탈로그). */
  listedForSale: boolean;
  /** 권한·결제 중 더 늦게 잡힌 시각(ms). */
  acquiredAt: number;
  /** 카드·상세에 쓰는 영상 페이로드 */
  feed: FeedVideo;
};

type Ctx = {
  hasPurchased: (videoId: string) => boolean;
  markPurchased: (videoId: string) => void;
  purchasedItems: readonly PurchasedListItem[];
};

const PurchasedVideosContext = createContext<Ctx | null>(null);

function placeholderFeed(videoId: string, title: string): FeedVideo {
  return {
    id: videoId,
    title,
    creator: "—",
    src: "/videos/sample1.mp4",
    poster: `https://picsum.photos/seed/${encodeURIComponent(videoId)}/720/1280`,
    orientation: "portrait",
    priceWon: 0,
    listing: { sellerId: "", views: 0, salesCount: 0 },
  };
}

function parseItem(row: Record<string, unknown>, videoId: string): PurchasedListItem {
  const acquiredAt =
    typeof row.acquiredAt === "number" && Number.isFinite(row.acquiredAt) ? row.acquiredAt : 0;
  const feed =
    row.feed && typeof row.feed === "object" && row.feed !== null && typeof (row.feed as FeedVideo).id === "string"
      ? (row.feed as FeedVideo)
      : placeholderFeed(
          videoId,
          typeof row.title === "string" ? row.title : videoId,
        );
  const listPriceWon =
    typeof row.listPriceWon === "number" && Number.isFinite(row.listPriceWon)
      ? row.listPriceWon
      : typeof row.priceWon === "number" && Number.isFinite(row.priceWon)
        ? row.priceWon
        : (feed.priceWon ?? 0);
  const paidPriceWon =
    typeof row.paidPriceWon === "number" && Number.isFinite(row.paidPriceWon)
      ? row.paidPriceWon
      : listPriceWon;
  const listedForSale = typeof row.listedForSale === "boolean" ? row.listedForSale : true;
  return {
    videoId,
    acquiredAt,
    paidPriceWon,
    listPriceWon,
    listedForSale,
    feed,
  };
}

export function PurchasedVideosProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [purchasedItems, setPurchasedItems] = useState<PurchasedListItem[]>([]);
  const restoreGuardRef = useRef(false);

  const reloadPurchasedIds = useCallback(async () => {
    try {
      const response = await fetch("/api/purchases/owned", {
        cache: "no-store",
        credentials: "include",
      });
      const data = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            videoIds?: string[];
            items?: Record<string, unknown>[];
          }
        | null;
      if (!response.ok || !data?.ok || !Array.isArray(data.videoIds)) {
        setIds(new Set());
        setPurchasedItems([]);
        return;
      }
      setIds(new Set(data.videoIds));
      const rowById = new Map<string, PurchasedListItem>();
      if (Array.isArray(data.items)) {
        for (const raw of data.items) {
          if (!raw || typeof raw !== "object") continue;
          const vid = raw.videoId;
          if (typeof vid !== "string") continue;
          rowById.set(vid, parseItem(raw as Record<string, unknown>, vid));
        }
      }
      setPurchasedItems(
        data.videoIds.map((videoId) => {
          const hit = rowById.get(videoId);
          if (hit) return hit;
          return parseItem({}, videoId);
        }),
      );
    } catch {
      setIds(new Set());
      setPurchasedItems([]);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!supabaseConfigured || !user) {
      setIds(new Set());
      setPurchasedItems([]);
      return;
    }

    restoreGuardRef.current = true;

    void (async () => {
      await reloadPurchasedIds();
      restoreGuardRef.current = false;
    })();
  }, [authLoading, reloadPurchasedIds, supabaseConfigured, user]);

  const hasPurchased = useCallback(
    (videoId: string) => ids.has(videoId),
    [ids],
  );

  const markPurchased = useCallback(
    (videoId: string) => {
      if (!supabaseConfigured || !user) return;
      setIds((prev) => {
        const next = new Set(prev);
        next.add(videoId);
        return next;
      });
      setPurchasedItems((prev) => {
        if (prev.some((row) => row.videoId === videoId)) return prev;
        return [
          ...prev,
          {
            videoId,
            paidPriceWon: 0,
            listPriceWon: 0,
            listedForSale: true,
            acquiredAt: Date.now(),
            feed: placeholderFeed(videoId, videoId),
          },
        ];
      });
      if (!restoreGuardRef.current) void reloadPurchasedIds();
    },
    [reloadPurchasedIds, supabaseConfigured, user],
  );

  const value = useMemo(
    () => ({ hasPurchased, markPurchased, purchasedItems }),
    [hasPurchased, markPurchased, purchasedItems],
  );

  return (
    <PurchasedVideosContext.Provider value={value}>
      {children}
    </PurchasedVideosContext.Provider>
  );
}

export function usePurchasedVideos(): Ctx {
  const ctx = useContext(PurchasedVideosContext);
  if (!ctx) {
    throw new Error("usePurchasedVideos must be used within PurchasedVideosProvider");
  }
  return ctx;
}
