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
import { useAuthSession } from "@/hooks/useAuthSession";

type Ctx = {
  hasPurchased: (videoId: string) => boolean;
  markPurchased: (videoId: string) => void;
};

const PurchasedVideosContext = createContext<Ctx | null>(null);

export function PurchasedVideosProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const restoreGuardRef = useRef(false);

  const reloadPurchasedIds = useCallback(async () => {
    try {
      const response = await fetch("/api/purchases/owned", {
        cache: "no-store",
        credentials: "include",
      });
      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; videoIds?: string[] }
        | null;
      if (!response.ok || !data?.ok || !Array.isArray(data.videoIds)) {
        setIds(new Set());
        return;
      }
      setIds(new Set(data.videoIds));
    } catch {
      setIds(new Set());
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!supabaseConfigured || !user) {
      setIds(new Set());
      return;
    }

    let cancelled = false;
    restoreGuardRef.current = true;

    void (async () => {
      await reloadPurchasedIds();
      restoreGuardRef.current = false;
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, reloadPurchasedIds, supabaseConfigured, user]);

  const hasPurchased = useCallback(
    (videoId: string) => ids.has(videoId),
    [ids],
  );

  const markPurchased = useCallback(
    (videoId: string) => {
      if (!supabaseConfigured || !user) return;
      // 실제 운영 구매권한은 Toss 결제 확정 API가 Purchase/UserEntitlement에 기록한다.
      // 이 함수는 결제 완료 직후 UI가 즉시 반응하도록 임시 반영한 뒤 서버 장부로 다시 동기화한다.
      setIds((prev) => {
        const next = new Set(prev);
        next.add(videoId);
        return next;
      });
      if (!restoreGuardRef.current) void reloadPurchasedIds();
    },
    [reloadPurchasedIds, supabaseConfigured, user],
  );

  const value = useMemo(
    () => ({ hasPurchased, markPurchased }),
    [hasPurchased, markPurchased],
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
