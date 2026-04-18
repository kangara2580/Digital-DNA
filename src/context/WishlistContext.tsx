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
import type { FeedVideo } from "@/data/videos";
import { useAuthSession } from "@/hooks/useAuthSession";
import {
  addFavorite,
  fetchUserFavorites,
  removeAllWishlistForUser,
  removeFavorite,
  type FavoriteRow,
} from "@/lib/supabaseFavorites";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { waitForSupabaseAccessToken } from "@/lib/waitSupabaseSessionReady";

export type WishlistEntry = {
  id: string;
  savedAt: number;
};

function rowsToWishlistEntries(rows: FavoriteRow[]): WishlistEntry[] {
  return rows.map((r) => {
    const t = Date.parse(r.created_at);
    return {
      id: r.video_id,
      savedAt: Number.isFinite(t) ? t : Date.now(),
    };
  });
}

type Ctx = {
  entries: WishlistEntry[];
  hydrated: boolean;
  count: number;
  isSaved: (videoId: string) => boolean;
  toggle: (video: FeedVideo) => void;
  remove: (videoId: string) => void;
  clear: () => Promise<void>;
};

const WishlistContext = createContext<Ctx | null>(null);

export function useWishlist() {
  const c = useContext(WishlistContext);
  if (!c) throw new Error("useWishlist must be used within WishlistProvider");
  return c;
}

export function useWishlistOptional() {
  return useContext(WishlistContext);
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const {
    user,
    session,
    loading: authLoading,
    supabaseConfigured,
  } = useAuthSession();
  const userId = user?.id ?? null;
  const [entries, setEntries] = useState<WishlistEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  /** fetch 실패 시 빈 배열로 덮어쓰지 않기 위한 마지막 성공 스냅샷 */
  const lastGoodEntriesRef = useRef<WishlistEntry[]>([]);
  const fetchGenerationRef = useRef(0);

  const reloadFromServer = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!userId || !supabase) return;
    const ready = await waitForSupabaseAccessToken(supabase);
    if (!ready) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[wishlist] reload skipped — no access token");
      }
      return;
    }
    const result = await fetchUserFavorites(supabase, userId);
    if (result.ok) {
      const next = rowsToWishlistEntries(result.rows);
      lastGoodEntriesRef.current = next;
      setEntries(next);
    } else if (process.env.NODE_ENV === "development") {
      console.warn("[wishlist] reload failed", result.errorMessage, result.errorCode);
    }
  }, [userId]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!supabaseConfigured || !userId) {
      fetchGenerationRef.current += 1;
      setEntries([]);
      lastGoodEntriesRef.current = [];
      setHydrated(true);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setHydrated(true);
      return;
    }

    const gen = ++fetchGenerationRef.current;
    let cancelled = false;

    void (async () => {
      const tokenReady = await waitForSupabaseAccessToken(supabase);
      if (cancelled || gen !== fetchGenerationRef.current) return;
      if (!tokenReady) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[wishlist] initial fetch skipped — session token not ready");
        }
        setHydrated(true);
        return;
      }

      const result = await fetchUserFavorites(supabase, userId);
      if (cancelled || gen !== fetchGenerationRef.current) return;

      if (result.ok) {
        const next = rowsToWishlistEntries(result.rows);
        lastGoodEntriesRef.current = next;
        setEntries(next);
      } else {
        if (process.env.NODE_ENV === "development") {
          console.warn("[wishlist] fetch failed — keeping previous entries", {
            message: result.errorMessage,
            code: result.errorCode,
          });
        }
        setEntries((prev) => (prev.length > 0 ? prev : lastGoodEntriesRef.current));
      }
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, supabaseConfigured, userId, session?.access_token]);

  const isSaved = useCallback(
    (videoId: string) => entries.some((e) => e.id === videoId),
    [entries],
  );

  const toggle = useCallback(
    (video: FeedVideo) => {
      if (authLoading) return;
      if (!supabaseConfigured || !userId) {
        if (typeof window !== "undefined") {
          window.alert("로그인 후 이용 가능합니다.");
        }
        return;
      }
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        if (typeof window !== "undefined") {
          window.alert("로그인 후 이용 가능합니다.");
        }
        return;
      }

      setEntries((prev) => {
        const on = prev.some((e) => e.id === video.id);
        if (on) {
          const removed = prev.find((e) => e.id === video.id);
          void removeFavorite(supabase, userId, video.id, "wishlist").then((r) => {
            if (!r.ok && removed) {
              setEntries((p) =>
                p.some((e) => e.id === video.id) ? p : [removed, ...p],
              );
              void reloadFromServer();
            }
          });
          return prev.filter((e) => e.id !== video.id);
        }

        const now = Date.now();
        const optimistic: WishlistEntry = { id: video.id, savedAt: now };
        void addFavorite(supabase, userId, video.id, "wishlist", now).then((r) => {
          if (!r.ok) {
            if (process.env.NODE_ENV === "development") {
              console.warn("[wishlist] addFavorite failed", r.errorMessage, r.errorCode);
            }
            setEntries((p) => p.filter((e) => e.id !== video.id));
            void reloadFromServer();
          }
        });
        return [optimistic, ...prev];
      });
    },
    [authLoading, supabaseConfigured, userId, reloadFromServer],
  );

  const remove = useCallback(
    (videoId: string) => {
      if (authLoading) return;
      if (!supabaseConfigured || !userId) return;
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      setEntries((prev) => {
        const removed = prev.find((e) => e.id === videoId);
        void removeFavorite(supabase, userId, videoId, "wishlist").then((r) => {
          if (!r.ok && removed) {
            setEntries((p) =>
              p.some((e) => e.id === videoId) ? p : [removed, ...p],
            );
            void reloadFromServer();
          }
        });
        return prev.filter((e) => e.id !== videoId);
      });
    },
    [authLoading, supabaseConfigured, userId, reloadFromServer],
  );

  const clear = useCallback(async () => {
    if (!supabaseConfigured || !userId) {
      setEntries([]);
      lastGoodEntriesRef.current = [];
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setEntries([]);
      return;
    }
    const ok = await removeAllWishlistForUser(supabase, userId);
    if (ok) {
      setEntries([]);
      lastGoodEntriesRef.current = [];
    } else {
      await reloadFromServer();
    }
  }, [supabaseConfigured, userId, reloadFromServer]);

  const value = useMemo(
    () => ({
      entries,
      hydrated,
      count: entries.length,
      isSaved,
      toggle,
      remove,
      clear,
    }),
    [entries, hydrated, isSaved, toggle, remove, clear],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}
