import type { FeedVideo } from "@/data/videos";

const CART_KEY = "digital-dna-guest-cart-v1";
const WISHLIST_KEY = "digital-dna-guest-wishlist-v1";

function isFeedVideo(v: unknown): v is FeedVideo {
  if (!v || typeof v !== "object") return false;
  const o = v as FeedVideo;
  return typeof o.id === "string" && typeof o.title === "string";
}

export function readGuestCartVideos(): FeedVideo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isFeedVideo);
  } catch {
    return [];
  }
}

export function writeGuestCartVideos(videos: FeedVideo[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(videos));
  } catch {
    /* quota / private mode */
  }
}

export type GuestWishlistEntry = { id: string; savedAt: number };

export function readGuestWishlist(): GuestWishlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is GuestWishlistEntry =>
        !!x &&
        typeof x === "object" &&
        typeof (x as GuestWishlistEntry).id === "string" &&
        typeof (x as GuestWishlistEntry).savedAt === "number",
    );
  } catch {
    return [];
  }
}

export function writeGuestWishlist(entries: GuestWishlistEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(entries));
  } catch {
    /* quota / private mode */
  }
}
