"use client";

import { motion, useAnimation, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { buildDopamineSpiralPath } from "@/lib/dopaminePath";

const SIZE = 40;
const HALF = SIZE / 2;

type Props = {
  particleId: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  poster?: string;
  removeParticle: (id: string) => void;
};

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function FlyingClipParticle({
  particleId,
  start,
  end,
  poster,
  removeParticle,
}: Props) {
  const reduceMotion = useReducedMotion() ?? false;
  const controls = useAnimation();

  useEffect(() => {
    let alive = true;

    const finish = () => {
      if (alive) removeParticle(particleId);
    };

    const run = async () => {
      await controls.set({
        x: 0,
        y: 0,
        scale: 0.22,
        opacity: 0,
        rotate: -10,
      });

      if (reduceMotion) {
        await controls.start({
          scale: 1,
          opacity: 1,
          rotate: 0,
          transition: { duration: 0.12, ease: "easeOut" },
        });
        await controls.start({
          x: end.x - start.x,
          y: end.y - start.y,
          rotate: 4,
          transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
        });
      } else {
        await controls.start({
          scale: 1,
          opacity: 1,
          rotate: 2,
          transition: {
            duration: 0.16,
            ease: [0.34, 1.25, 0.64, 1],
          },
        });
        await sleep(72);
        if (!alive) return;

        const { xs, ys } = buildDopamineSpiralPath(
          start.x,
          start.y,
          end.x,
          end.y,
          15,
        );
        const kx = xs.map((xi) => xi - start.x);
        const ky = ys.map((yi) => yi - start.y);
        const kr = kx.map((_, i) => 2 + i * 1.85 + Math.sin(i * 0.55) * 3);
        const times = kx.map((_, i) => i / (kx.length - 1));

        await controls.start({
          x: kx,
          y: ky,
          rotate: kr,
          transition: {
            duration: 0.58,
            ease: [0.2, 0.95, 0.24, 1],
            times,
          },
        });
      }

      finish();
    };

    void run();
    return () => {
      alive = false;
    };
  }, [
    controls,
    end.x,
    end.y,
    particleId,
    reduceMotion,
    removeParticle,
    start.x,
    start.y,
  ]);

  return (
    <motion.div
      className="pointer-events-none fixed z-[100000] overflow-hidden rounded-lg border-2 border-white/95 shadow-[0_8px_28px_-6px_rgba(15,23,42,0.45)]"
      style={{
        width: SIZE,
        height: SIZE,
        left: start.x - HALF,
        top: start.y - HALF,
        backgroundColor: poster ? undefined : "rgb(51 65 85)",
        backgroundImage: poster ? `url(${poster})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        willChange: "transform, opacity",
      }}
      initial={false}
      animate={controls}
    />
  );
}
