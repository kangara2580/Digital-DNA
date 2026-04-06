"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import type { TrendingRankMetrics } from "@/data/trendingStats";
import { getTrendingMetrics } from "@/data/trendingStats";
import type { FeedVideo } from "@/data/videos";

export type LiveTrendingEntry = {
  /** 정렬이 바뀌어도 불변 — 리스트 key */
  instanceId: string;
  video: FeedVideo;
  metrics: TrendingRankMetrics;
};

function initRows(clips: FeedVideo[]): LiveTrendingEntry[] {
  const rows: LiveTrendingEntry[] = clips.map((video, i) => {
    const m = getTrendingMetrics(video.id, i);
    return {
      instanceId: `tl-${i}-${video.id}`,
      video,
      metrics: { ...m },
    };
  });
  rows.sort((a, b) => b.metrics.cumulativeRevenueWon - a.metrics.cumulativeRevenueWon);
  return rows;
}

function applyTick(
  row: LiveTrendingEntry,
  momentumRef: MutableRefObject<Record<string, number>>,
): LiveTrendingEntry {
  const prev = row.metrics.cumulativeRevenueWon;
  const vol = 0.00055 + Math.random() * 0.0024;
  const drift = (Math.random() - 0.48) * vol * prev;
  const spike =
    Math.random() < 0.038 ? (Math.random() - 0.5) * prev * 0.0095 : 0;
  let next = Math.round(prev + drift + spike);
  next = Math.max(95_000, Math.min(99_000_000, next));

  const viewBump = Math.floor(
    18 + Math.random() * 110 + Math.max(0, drift / 900),
  );
  const likeBump = Math.floor(
    1 + Math.random() * 7 + Math.max(0, drift / 8000),
  );

  const instantPct = prev > 0 ? ((next - prev) / prev) * 100 : 0;
  const pMom =
    momentumRef.current[row.instanceId] ?? row.metrics.growthPercent * 0.45;
  const mom = pMom * 0.84 + instantPct * 2200;
  momentumRef.current[row.instanceId] = mom;
  const growthPercent = Math.max(
    -48,
    Math.min(48, Math.round(mom * 10) / 10),
  );

  return {
    ...row,
    metrics: {
      cumulativeRevenueWon: next,
      totalViews: row.metrics.totalViews + viewBump,
      totalLikes: row.metrics.totalLikes + likeBump,
      growthPercent,
    },
  };
}

type Options = {
  /** 기본 ~1.1s, 감소 모션 시 느리게 */
  tickMs?: number;
  reducedMotion?: boolean;
};

/**
 * 구매 누적수익(원)을 주기적으로 흔들고, 내림차순으로 재정렬하는 데모 보드.
 * 실서비스는 WebSocket / 폴링 API로 동일 패턴으로 교체하면 됩니다.
 */
export function useTrendingLiveRanking(
  clips: FeedVideo[],
  opts?: Options,
): LiveTrendingEntry[] {
  const reduced = opts?.reducedMotion ?? false;
  const tickMs = reduced ? 4200 : (opts?.tickMs ?? 1150);

  const clipsSig = useMemo(
    () => clips.map((c, i) => `${i}:${c.id}`).join("|"),
    [clips],
  );

  const [rows, setRows] = useState<LiveTrendingEntry[]>(() => initRows(clips));
  const momentumRef = useRef<Record<string, number>>({});

  useEffect(() => {
    setRows(initRows(clips));
    momentumRef.current = {};
  }, [clips, clipsSig]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRows((prev) => {
        const updated = prev.map((row) => applyTick(row, momentumRef));
        updated.sort(
          (a, b) => b.metrics.cumulativeRevenueWon - a.metrics.cumulativeRevenueWon,
        );
        return updated;
      });
    }, tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  return rows;
}
