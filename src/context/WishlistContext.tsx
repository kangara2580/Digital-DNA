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
import { redirectToLoginStart } from "@/lib/authRequiredRedirect";
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

/**
 * 서버 fetch 직후 스냅샷 적용 시, 아직 목록에 없는 로컬 항목을 유지한다.
 * 방금 찜했을 때 토큰 갱신·재조회 레이스로 서버 응답에 행이 없으면 아이콘이 하얘지는 버그를 막음.
 */
function mergeWishlistServerIntoPrev(rows: FavoriteRow[], prev: WishlistEntry[]): WishlistEntry[] {
  const server = rowsToWishlistEntries(rows);
  if (server.length === 0) return prev.length > 0 ? prev : server;

  const serverIds = new Set(server.map((e) => e.id));
  const onlyLocal = prev.filter((e) => !serverIds.has(e.id));
  if (onlyLocal.length === 0) return server;

  const byId = new Map<string, WishlistEntry>();
  for (const e of server) byId.set(e.id, e);
  for (const e of onlyLocal) {
    if (!byId.has(e.id)) byId.set(e.id, e);
  }
  return [...byId.values()].sort((a, b) => b.savedAt - a.savedAt);
}

type Ctx = {
  entries: WishlistEntry[];
  hydrated: boolean;
  /** 서버 찜 목록 초기 로드 완료 전에는 토글 시 레이스·무응답 방지(장바구니 cartSyncReady 와 동일) */
  wishlistSyncReady: boolean;
  count: number;
  isSaved: (videoId: string) => boolean;
  toggle: (video: FeedVideo) => void;
  remove: (videoId: string) => void;
  removeMany: (videoIds: string[]) => Promise<void>;
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
  const entriesRef = useRef<WishlistEntry[]>([]);
  entriesRef.current = entries;
  const fetchGenerationRef = useRef(0);
  const [wishlistSyncReady, setWishlistSyncReady] = useState(false);

  const alertLoginRequired = useCallback(() => {
    redirectToLoginStart();
  }, []);

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
      setEntries((prev) => {
        const merged = mergeWishlistServerIntoPrev(result.rows, prev);
        lastGoodEntriesRef.current = merged;
        return merged;
      });
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
      lastGoodEntriesRef.current = [];
      setEntries([]);
      setWishlistSyncReady(true);
      setHydrated(true);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setWishlistSyncReady(true);
      setHydrated(true);
      return;
    }

    const gen = ++fetchGenerationRef.current;
    let cancelled = false;
    setWishlistSyncReady(false);

    void (async () => {
      const tokenReady = await waitForSupabaseAccessToken(supabase);
      if (cancelled || gen !== fetchGenerationRef.current) return;
      if (!tokenReady) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[wishlist] initial fetch skipped — session token not ready");
        }
        setWishlistSyncReady(true);
        setHydrated(true);
        return;
      }

      const result = await fetchUserFavorites(supabase, userId);
      if (cancelled || gen !== fetchGenerationRef.current) return;

      if (result.ok) {
        setEntries((prev) => {
          const merged = mergeWishlistServerIntoPrev(result.rows, prev);
          lastGoodEntriesRef.current = merged;
          return merged;
        });
      } else {
        if (process.env.NODE_ENV === "development") {
          console.warn("[wishlist] fetch failed — keeping previous entries", {
            message: result.errorMessage,
            code: result.errorCode,
          });
        }
        setEntries((prev) => (prev.length > 0 ? prev : lastGoodEntriesRef.current));
      }
      setWishlistSyncReady(true);
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
        alertLoginRequired();
        return;
      }
      if (!wishlistSyncReady) {
        if (typeof window !== "undefined") {
          window.alert("찜 목록을 불러오는 중입니다. 잠시 후 다시 눌러 주세요.");
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

      /** 낙관적 UI를 즉시 반영한 뒤 백그라운드에서 동기화(이전: await 토큰 후에만 setEntries → 클릭이 먹통처럼 보임) */
      setEntries((prev) => {
        const on = prev.some((e) => e.id === video.id);
        if (on) {
          const removed = prev.find((e) => e.id === video.id);
          void (async () => {
            const ready = await waitForSupabaseAccessToken(supabase);
            if (!ready) {
              if (removed) {
                setEntries((p) =>
                  p.some((e) => e.id === video.id) ? p : [removed, ...p],
                );
              }
              if (typeof window !== "undefined") {
                window.alert("세션을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
              }
              return;
            }
            const r = await removeFavorite(supabase, userId, video.id, "wishlist");
            if (!r.ok && removed) {
              setEntries((p) =>
                p.some((e) => e.id === video.id) ? p : [removed, ...p],
              );
              void reloadFromServer();
            }
          })();
          return prev.filter((e) => e.id !== video.id);
        }

        const now = Date.now();
        const optimistic: WishlistEntry = { id: video.id, savedAt: now };
        void (async () => {
          const ready = await waitForSupabaseAccessToken(supabase);
          if (!ready) {
            setEntries((p) => p.filter((e) => e.id !== video.id));
            if (typeof window !== "undefined") {
              window.alert("세션을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
            }
            return;
          }
          const r = await addFavorite(supabase, userId, video.id, "wishlist", now);
          if (!r.ok) {
            if (process.env.NODE_ENV === "development") {
              console.warn("[wishlist] addFavorite failed", r.errorMessage, r.errorCode);
            }
            setEntries((p) => p.filter((e) => e.id !== video.id));
            void reloadFromServer();
          }
        })();
        return [optimistic, ...prev];
      });
    },
    [
      authLoading,
      supabaseConfigured,
      userId,
      wishlistSyncReady,
      reloadFromServer,
      alertLoginRequired,
    ],
  );

  const remove = useCallback(
    (videoId: string) => {
      if (authLoading) return;
      if (!supabaseConfigured || !userId) {
        alertLoginRequired();
        return;
      }
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
    [authLoading, supabaseConfigured, userId, reloadFromServer, alertLoginRequired],
  );

  const removeMany = useCallback(
    async (videoIds: string[]) => {
      const uniq = [...new Set(videoIds)].filter(Boolean);
      if (uniq.length === 0) return;
      if (!supabaseConfigured || !userId) {
        alertLoginRequired();
        return;
      }
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const ready = await waitForSupabaseAccessToken(supabase);
      if (!ready) return;
      const prevSnapshot = entriesRef.current;
      setEntries((p) => p.filter((e) => !uniq.includes(e.id)));
      const results = await Promise.all(
        uniq.map((id) => removeFavorite(supabase, userId, id, "wishlist")),
      );
      if (results.some((r) => !r.ok)) {
        setEntries(prevSnapshot);
        await reloadFromServer();
      }
    },
    [supabaseConfigured, userId, reloadFromServer, alertLoginRequired],
  );

  const clear = useCallback(async () => {
    if (!supabaseConfigured || !userId) {
      alertLoginRequired();
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
  }, [supabaseConfigured, userId, reloadFromServer, alertLoginRequired]);

  const value = useMemo(
    () => ({
      entries,
      hydrated,
      wishlistSyncReady,
      count: entries.length,
      isSaved,
      toggle,
      remove,
      removeMany,
      clear,
    }),
    [entries, hydrated, wishlistSyncReady, isSaved, toggle, remove, removeMany, clear],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}
