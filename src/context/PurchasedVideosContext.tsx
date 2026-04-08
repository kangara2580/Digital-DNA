"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "reels-market-purchased-ids";

function readIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function writeIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

type Ctx = {
  /** 모션 권리 구매(데모) 완료 여부 */
  hasPurchased: (videoId: string) => boolean;
  /** 구매 완료 처리 — 창작하기 버튼 활성화 */
  markPurchased: (videoId: string) => void;
};

const PurchasedVideosContext = createContext<Ctx | null>(null);

export function PurchasedVideosProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIds(readIds());
  }, []);

  const hasPurchased = useCallback(
    (videoId: string) => ids.has(videoId),
    [ids],
  );

  const markPurchased = useCallback((videoId: string) => {
    setIds((prev) => {
      const next = new Set(prev);
      next.add(videoId);
      writeIds(next);
      return next;
    });
  }, []);

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
