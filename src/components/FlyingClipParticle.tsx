"use client";

import { motion, useAnimation, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { buildElasticArcPath } from "@/lib/dopaminePath";

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

      const tuckIn = async (lastRotate: number) => {
        await controls.start({
          x: end.x - start.x,
          y: end.y - start.y,
          scale: 0.08,
          opacity: 0,
          rotate: lastRotate * 0.35,
          transition: {
            duration: 0.15,
            ease: [0.55, 0, 0.95, 0.45],
          },
        });
      };

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
          rotate: 5,
          transition: {
            duration: 0.34,
            ease: [0.28, 1.15, 0.45, 1],
          },
        });
        await tuckIn(4);
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
        await sleep(56);
        if (!alive) return;

        const { xs, ys, rotations } = buildElasticArcPath(
          start.x,
          start.y,
          end.x,
          end.y,
          18,
        );
        const kx = xs.map((xi) => xi - start.x);
        const ky = ys.map((yi) => yi - start.y);
        const kr = rotations;
        const times = kx.map((_, i) => i / (kx.length - 1));

        await controls.start({
          x: kx,
          y: ky,
          rotate: kr,
          scale: 1,
          opacity: 1,
          transition: {
            duration: 0.52,
            /** 쫀득·빠른 가속 후 부드럽게 착지 */
            ease: [0.28, 1.22, 0.42, 1.02],
            times,
          },
        });
        const lastR = kr[kr.length - 1] ?? 0;
        await tuckIn(lastR);
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
      className="pointer-events-none fixed z-[100000] origin-center overflow-hidden rounded-lg border-2 border-white/95 shadow-[0_8px_28px_-6px_rgba(15,23,42,0.45)]"
      style={{
        width: SIZE,
        height: SIZE,
        left: start.x - HALF,
        top: start.y - HALF,
        transformOrigin: "50% 50%",
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
