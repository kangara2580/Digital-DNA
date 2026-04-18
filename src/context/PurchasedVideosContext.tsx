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
} from "@/lib/supabaseUserSync";

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

    if (!supabaseConfigured || !user) {
      setIds(new Set());
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let cancelled = false;
    restoreGuardRef.current = true;

    void (async () => {
      const server = await fetchUserPurchasedIds(supabase, user.id);
      if (!cancelled) setIds(new Set(server));
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
      if (!supabaseConfigured || !user) return;
      setIds((prev) => {
        const next = new Set(prev);
        next.add(videoId);
        return next;
      });
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        void addUserPurchasedVideo(supabase, user.id, videoId).then((ok) => {
          if (!ok && !restoreGuardRef.current) {
            void fetchUserPurchasedIds(supabase, user.id).then((remote) => {
              setIds(new Set(remote));
            });
          }
        });
      }
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
