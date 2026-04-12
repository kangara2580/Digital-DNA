"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/** 복제 지수 숫자가 살짝 올라가는 느낌(데모용) — 다수 카드에서 rAF 폭주 방지 */
export function CloneCountAnimation({ value }: { value: number }) {
  const reduceMotion = useReducedMotion() ?? false;
  const [n, setN] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setN(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const dur = 1000;
    const lead = Math.min(500, Math.floor(value * 0.12));
    const from = Math.max(0, value - lead);

    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 2.6);
      setN(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setN(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduceMotion]);

  return <span className="tabular-nums">{n.toLocaleString("en-US")}</span>;
}
