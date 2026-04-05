"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FeedVideo } from "@/data/videos";

export type BuilderTimelineItem = {
  key: string;
  video: FeedVideo;
};

type Ctx = {
  cartAnchorRef: React.RefObject<HTMLAnchorElement | null>;
  cartCount: number;
  /** 장바구니에 담기 — 비행 애니 없이 조합기 타임라인만 갱신 */
  launchFromCartButton: (
    _buttonEl: HTMLElement,
    video: FeedVideo,
    _poster?: string,
  ) => void;
  builderItems: BuilderTimelineItem[];
  removeBuilderItem: (key: string) => void;
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

export function DopamineBasketProvider({ children }: { children: React.ReactNode }) {
  const cartAnchorRef = useRef<HTMLAnchorElement | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [builderItems, setBuilderItems] = useState<BuilderTimelineItem[]>([]);
  const builderSeq = useRef(0);

  const launchFromCartButton = useCallback(
    (_buttonEl: HTMLElement, video: FeedVideo, _poster?: string) => {
      if (typeof window === "undefined") return;
      const key = `b-${video.id}-${++builderSeq.current}`;
      setBuilderItems((items) => [...items, { key, video }]);
      setCartCount((c) => Math.min(c + 1, 99));
    },
    [],
  );

  const removeBuilderItem = useCallback((key: string) => {
    setBuilderItems((items) => items.filter((x) => x.key !== key));
  }, []);

  const clearBuilder = useCallback(() => {
    setBuilderItems([]);
  }, []);

  const value = useMemo(
    () => ({
      cartAnchorRef,
      cartCount,
      launchFromCartButton,
      builderItems,
      removeBuilderItem,
      clearBuilder,
    }),
    [cartCount, launchFromCartButton, builderItems, removeBuilderItem, clearBuilder],
  );

  return (
    <DopamineBasketContext.Provider value={value}>{children}</DopamineBasketContext.Provider>
  );
}
