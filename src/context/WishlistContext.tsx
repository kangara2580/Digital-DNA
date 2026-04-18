"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { FeedVideo } from "@/data/videos";
import { useAuthSession } from "@/hooks/useAuthSession";
import {
  addFavorite,
  fetchUserFavorites,
  removeAllWishlistForUser,
  removeFavorite,
  type FavoriteKind,
  type FavoriteRow,
} from "@/lib/supabaseFavorites";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const LEGACY_STORAGE_KEY = "digital-dna-wishlist-v1";

export type WishlistEntry = {
  id: string;
  savedAt: number;
};

function parseStored(raw: string | null): WishlistEntry[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p
      .filter(
        (x): x is WishlistEntry =>
          x != null &&
          typeof x === "object" &&
          typeof (x as WishlistEntry).id === "string" &&
          typeof (x as WishlistEntry).savedAt === "number",
      )
      .map((x) => ({ id: x.id, savedAt: x.savedAt }));
  } catch {
    return [];
  }
}

function loadLegacyEntries(): WishlistEntry[] {
  if (typeof window === "undefined") return [];
  return parseStored(localStorage.getItem(LEGACY_STORAGE_KEY));
}

function persistLegacy(entries: WishlistEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* quota / private mode */
  }
}

function clearLegacyStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function rowsToEntries(rows: FavoriteRow[], kind: FavoriteKind): WishlistEntry[] {
  return rows
    .filter((r) => r.kind === kind)
    .map((r) => {
      const t = Date.parse(r.created_at);
      return {
        id: r.video_id,
        savedAt: Number.isFinite(t) ? t : Date.now(),
      };
    });
}

async function mergeLegacyWishlistIntoRemote(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
  userId: string,
  remote: FavoriteRow[],
): Promise<void> {
  const existing = new Set(
    remote.filter((r) => r.kind === "wishlist").map((r) => r.video_id),
  );
  const local = loadLegacyEntries();
  if (local.length === 0) return;

  let migrated = false;
  for (const e of local) {
    if (existing.has(e.id)) continue;
    const ok = await addFavorite(supabase, userId, e.id, "wishlist", e.savedAt);
    if (ok) migrated = true;
  }
  if (migrated) clearLegacyStorage();
}

type Ctx = {
  entries: WishlistEntry[];
  likeEntries: WishlistEntry[];
  hydrated: boolean;
  count: number;
  likeCount: number;
  isSaved: (videoId: string) => boolean;
  isLiked: (videoId: string) => boolean;
  toggle: (video: FeedVideo) => void;
  toggleLike: (video: FeedVideo) => void;
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
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const [entries, setEntries] = useState<WishlistEntry[]>([]);
  const [likeEntries, setLikeEntries] = useState<WishlistEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const reloadFromServer = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!user || !supabase) return;
    const rows = await fetchUserFavorites(supabase, user.id);
    setEntries(rowsToEntries(rows, "wishlist"));
    setLikeEntries(rowsToEntries(rows, "like"));
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      setHydrated(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      if (!supabaseConfigured) {
        setEntries(loadLegacyEntries());
        setLikeEntries([]);
        if (!cancelled) setHydrated(true);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!user || !supabase) {
        setEntries([]);
        setLikeEntries([]);
        if (!cancelled) setHydrated(true);
        return;
      }

      const rows = await fetchUserFavorites(supabase, user.id);
      if (cancelled) return;

      await mergeLegacyWishlistIntoRemote(supabase, user.id, rows);
      const rowsAfter = await fetchUserFavorites(supabase, user.id);
      if (cancelled) return;

      setEntries(rowsToEntries(rowsAfter, "wishlist"));
      setLikeEntries(rowsToEntries(rowsAfter, "like"));
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, supabaseConfigured, user]);

  const isSaved = useCallback(
    (videoId: string) => entries.some((e) => e.id === videoId),
    [entries],
  );

  const isLiked = useCallback(
    (videoId: string) => likeEntries.some((e) => e.id === videoId),
    [likeEntries],
  );

  const toggle = useCallback(
    (video: FeedVideo) => {
      if (authLoading) return;

      if (supabaseConfigured && !user) {
        if (typeof window !== "undefined") {
          window.alert("로그인 후 이용 가능합니다.");
        }
        return;
      }

      if (!supabaseConfigured) {
        setEntries((prev) => {
          const i = prev.findIndex((e) => e.id === video.id);
          const next =
            i >= 0
              ? prev.filter((_, j) => j !== i)
              : [...prev, { id: video.id, savedAt: Date.now() }];
          persistLegacy(next);
          return next;
        });
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!user || !supabase) return;

      const on = entries.some((e) => e.id === video.id);
      if (on) {
        setEntries((prev) => prev.filter((e) => e.id !== video.id));
        void removeFavorite(supabase, user.id, video.id, "wishlist").then(
          (ok) => {
            if (!ok) void reloadFromServer();
          },
        );
      } else {
        const now = Date.now();
        setEntries((prev) => [{ id: video.id, savedAt: now }, ...prev]);
        void addFavorite(supabase, user.id, video.id, "wishlist").then((ok) => {
          if (!ok) void reloadFromServer();
        });
      }
    },
    [
      authLoading,
      supabaseConfigured,
      user,
      entries,
      reloadFromServer,
    ],
  );

  const toggleLike = useCallback(
    (video: FeedVideo) => {
      if (authLoading) return;

      if (supabaseConfigured && !user) {
        if (typeof window !== "undefined") {
          window.alert("로그인 후 이용 가능합니다.");
        }
        return;
      }

      if (!supabaseConfigured) {
        setLikeEntries((prev) => {
          const i = prev.findIndex((e) => e.id === video.id);
          const next =
            i >= 0
              ? prev.filter((_, j) => j !== i)
              : [...prev, { id: video.id, savedAt: Date.now() }];
          return next;
        });
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!user || !supabase) return;

      const on = likeEntries.some((e) => e.id === video.id);
      if (on) {
        setLikeEntries((prev) => prev.filter((e) => e.id !== video.id));
        void removeFavorite(supabase, user.id, video.id, "like").then((ok) => {
          if (!ok) void reloadFromServer();
        });
      } else {
        const now = Date.now();
        setLikeEntries((prev) => [{ id: video.id, savedAt: now }, ...prev]);
        void addFavorite(supabase, user.id, video.id, "like").then((ok) => {
          if (!ok) void reloadFromServer();
        });
      }
    },
    [
      authLoading,
      supabaseConfigured,
      user,
      likeEntries,
      reloadFromServer,
    ],
  );

  const remove = useCallback(
    (videoId: string) => {
      if (authLoading) return;

      if (supabaseConfigured && !user) {
        if (typeof window !== "undefined") {
          window.alert("로그인 후 이용 가능합니다.");
        }
        return;
      }

      if (!supabaseConfigured) {
        setEntries((prev) => {
          const next = prev.filter((e) => e.id !== videoId);
          persistLegacy(next);
          return next;
        });
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!user || !supabase) return;

      setEntries((prev) => prev.filter((e) => e.id !== videoId));
      void removeFavorite(supabase, user.id, videoId, "wishlist").then((ok) => {
        if (!ok) void reloadFromServer();
      });
    },
    [authLoading, supabaseConfigured, user, reloadFromServer],
  );

  const clear = useCallback(async () => {
    if (!supabaseConfigured) {
      setEntries([]);
      persistLegacy([]);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!user || !supabase) {
      setEntries([]);
      return;
    }

    const ok = await removeAllWishlistForUser(supabase, user.id);
    if (ok) {
      setEntries([]);
    } else {
      await reloadFromServer();
    }
  }, [supabaseConfigured, user, reloadFromServer]);

  const value = useMemo(
    () => ({
      entries,
      likeEntries,
      hydrated,
      count: entries.length,
      likeCount: likeEntries.length,
      isSaved,
      isLiked,
      toggle,
      toggleLike,
      remove,
      clear,
    }),
    [
      entries,
      likeEntries,
      hydrated,
      isSaved,
      isLiked,
      toggle,
      toggleLike,
      remove,
      clear,
    ],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}
