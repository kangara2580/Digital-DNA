"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type FlyRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type CartFlyItem = {
  id: string;
  poster: string;
  from: FlyRect;
  to: FlyRect;
};

function snapRect(r: DOMRect): FlyRect {
  return {
    left: r.left,
    top: r.top,
    width: r.width,
    height: r.height,
  };
}

export function rectFromEl(el: HTMLElement): FlyRect {
  return snapRect(el.getBoundingClientRect());
}

function FlyPiece({
  item,
  onDone,
}: {
  item: CartFlyItem;
  onDone: () => void;
}) {
  const reduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    if (reduceMotion) onDone();
  }, [reduceMotion, onDone]);

  if (reduceMotion) return null;

  const { from, to, poster } = item;
  const targetW = 40;
  const targetH = Math.max(28, Math.round((targetW * from.height) / Math.max(from.width, 1)));

  return (
    <motion.div
      className="pointer-events-none fixed z-[99990] overflow-hidden rounded-md border-2 border-white shadow-[0_10px_36px_-4px_rgba(0,0,0,0.45)]"
      initial={{
        left: from.left,
        top: from.top,
        width: from.width,
        height: from.height,
        opacity: 0.98,
      }}
      animate={{
        left: to.left + to.width / 2 - targetW / 2,
        top: to.top + to.height / 2 - targetH / 2,
        width: targetW,
        height: targetH,
        opacity: 0.75,
      }}
      transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={onDone}
      style={{ position: "fixed", willChange: "left, top, width, height" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster} alt="" className="h-full w-full object-cover" draggable={false} />
    </motion.div>
  );
}

export function CartThumbnailFlyLayer({
  items,
  onRemove,
}: {
  items: CartFlyItem[];
  onRemove: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || items.length === 0) return null;

  return createPortal(
    <>
      {items.map((item) => (
        <FlyPiece
          key={item.id}
          item={item}
          onDone={() => onRemove(item.id)}
        />
      ))}
    </>,
    document.body,
  );
}
