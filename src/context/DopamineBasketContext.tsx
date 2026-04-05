"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CartThumbnailFlyLayer,
  type CartFlyItem,
  rectFromEl,
} from "@/components/CartThumbnailFly";
import type { FeedVideo } from "@/data/videos";

export type BuilderTimelineItem = {
  key: string;
  video: FeedVideo;
};

type Ctx = {
  cartAnchorRef: React.RefObject<HTMLAnchorElement | null>;
  cartCount: number;
  /** 장바구니 아이콘까지 썸네일 비행 후 조합기 타임라인 갱신 */
  launchFromCartButton: (
    buttonEl: HTMLElement,
    video: FeedVideo,
    poster?: string,
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
  const [builderItems, setBuilderItems] = useState<BuilderTimelineItem[]>([]);
  const [flyItems, setFlyItems] = useState<CartFlyItem[]>([]);
  const builderSeq = useRef(0);
  const flySeq = useRef(0);

  const removeFly = useCallback((id: string) => {
    setFlyItems((items) => items.filter((x) => x.id !== id));
  }, []);

  const launchFromCartButton = useCallback(
    (buttonEl: HTMLElement, video: FeedVideo, poster?: string) => {
      if (typeof window === "undefined") return;
      const key = `b-${video.id}-${++builderSeq.current}`;
      setBuilderItems((items) => [...items, { key, video }]);

      const cartEl = cartAnchorRef.current;
      if (!cartEl) return;

      const from = rectFromEl(buttonEl);
      const to = rectFromEl(cartEl);
      if (from.width < 4 || from.height < 4 || to.width < 2) return;

      const id = `fly-${++flySeq.current}-${Date.now()}`;
      setFlyItems((items) => [
        ...items,
        {
          id,
          poster: poster ?? video.poster,
          from,
          to,
        },
      ]);
    },
    [],
  );

  const removeBuilderItem = useCallback((key: string) => {
    setBuilderItems((items) => items.filter((x) => x.key !== key));
  }, []);

  const clearBuilder = useCallback(() => {
    setBuilderItems([]);
  }, []);

  const cartCount = builderItems.length;

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
    <DopamineBasketContext.Provider value={value}>
      {children}
      <CartThumbnailFlyLayer items={flyItems} onRemove={removeFly} />
    </DopamineBasketContext.Provider>
  );
}
