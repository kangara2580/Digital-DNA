"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { FlyingClipParticle } from "@/components/FlyingClipParticle";
import type { FeedVideo } from "@/data/videos";

type Vec2 = { x: number; y: number };

type Particle = {
  id: string;
  start: Vec2;
  end: Vec2;
  poster?: string;
};

export type BuilderTimelineItem = {
  key: string;
  video: FeedVideo;
};

type Ctx = {
  cartAnchorRef: React.RefObject<HTMLAnchorElement | null>;
  cartCount: number;
  /** 장바구니 버튼(비디오 위) 기준으로 날리기 + 조합기 타임라인에 추가 */
  launchFromCartButton: (buttonEl: HTMLElement, video: FeedVideo, poster?: string) => void;
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

/** Provider 밖(SSR 등)에서도 안전하게 호출 */
export function useDopamineBasketOptional() {
  return useContext(DopamineBasketContext);
}

export function DopamineBasketProvider({ children }: { children: React.ReactNode }) {
  const cartAnchorRef = useRef<HTMLAnchorElement | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [builderItems, setBuilderItems] = useState<BuilderTimelineItem[]>([]);
  const idRef = useRef(0);
  const builderSeq = useRef(0);

  const launchFromCartButton = useCallback(
    (buttonEl: HTMLElement, video: FeedVideo, poster?: string) => {
      const cartEl = cartAnchorRef.current;
      if (!cartEl || typeof window === "undefined") return;

      const cr = cartEl.getBoundingClientRect();
      const br = buttonEl.getBoundingClientRect();
      const iconEl = cartEl.querySelector(
        "[data-cart-fly-target]",
      ) as HTMLElement | null;
      const tr = iconEl?.getBoundingClientRect() ?? cr;
      const end = {
        x: tr.left + tr.width / 2,
        y: tr.top + tr.height / 2 + 1,
      };
      const start = {
        x: br.left + br.width / 2,
        y: br.top + br.height / 2,
      };

      const id = `fly-${++idRef.current}`;
      setParticles((p) => [...p, { id, start, end, poster }]);

      const key = `b-${video.id}-${++builderSeq.current}`;
      setBuilderItems((items) => [...items, { key, video }]);
    },
    [],
  );

  const removeParticle = useCallback((id: string) => {
    setParticles((p) => p.filter((x) => x.id !== id));
    setCartCount((c) => Math.min(c + 1, 99));
  }, []);

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
    <DopamineBasketContext.Provider value={value}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <>
            {particles.map((p) => (
              <FlyingClipParticle
                key={p.id}
                particleId={p.id}
                start={p.start}
                end={p.end}
                poster={p.poster}
                removeParticle={removeParticle}
              />
            ))}
          </>,
          document.body,
        )}
    </DopamineBasketContext.Provider>
  );
}
