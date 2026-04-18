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
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  addUserPurchasedVideo,
  fetchUserPurchasedIds,
  replaceUserDemoPurchases,
} from "@/lib/supabaseUserSync";

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
  hasPurchased: (videoId: string) => boolean;
  markPurchased: (videoId: string) => void;
};

const PurchasedVideosContext = createContext<Ctx | null>(null);

export function PurchasedVideosProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const restoreGuardRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    restoreGuardRef.current = true;

    void (async () => {
      if (!supabaseConfigured) {
        if (!cancelled) setIds(readIds());
        restoreGuardRef.current = false;
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!user || !supabase) {
        if (!cancelled) setIds(readIds());
        restoreGuardRef.current = false;
        return;
      }

      const server = await fetchUserPurchasedIds(supabase, user.id);
      if (cancelled) return;
      const guest = readIds();
      const merged = new Set([...server, ...guest]);
      if (guest.size > 0) {
        writeIds(new Set());
        await replaceUserDemoPurchases(supabase, user.id, [...merged]);
      }
      if (!cancelled) setIds(merged);
      restoreGuardRef.current = false;
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, supabaseConfigured, user]);

  const hasPurchased = useCallback(
    (videoId: string) => ids.has(videoId),
    [ids],
  );

  const markPurchased = useCallback(
    (videoId: string) => {
      setIds((prev) => {
        const next = new Set(prev);
        next.add(videoId);
        if (!supabaseConfigured || !user) {
          writeIds(next);
        } else {
          const supabase = getSupabaseBrowserClient();
          if (supabase) {
            void addUserPurchasedVideo(supabase, user.id, videoId).then((ok) => {
              if (!ok && restoreGuardRef.current === false) {
                void fetchUserPurchasedIds(supabase, user.id).then((remote) => {
                  setIds(new Set(remote));
                });
              }
            });
          }
        }
        return next;
      });
    },
    [supabaseConfigured, user],
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
