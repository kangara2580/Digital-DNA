type EventType =
  | "background_preview_applied"
  | "font_selected"
  | "draft_saved";

export type BehaviorEvent = {
  type: EventType;
  keyword?: string;
  mode?: "video" | "image";
  fontFamily?: string;
  videoId?: string;
  timestamp: string;
};

const recentEvents: BehaviorEvent[] = [];
const keywordCounts = new Map<string, number>();
const fontCounts = new Map<string, number>();

function inc(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

export function pushBehaviorEvent(event: Omit<BehaviorEvent, "timestamp">) {
  const next: BehaviorEvent = { ...event, timestamp: new Date().toISOString() };
  recentEvents.push(next);
  if (recentEvents.length > 1000) recentEvents.splice(0, recentEvents.length - 1000);

  if (next.keyword) {
    const norm = next.keyword.trim().toLowerCase();
    if (norm) inc(keywordCounts, norm);
  }
  if (next.fontFamily) {
    const norm = next.fontFamily.trim();
    if (norm) inc(fontCounts, norm);
  }
}

export function getBehaviorSummary() {
  const topKeywords = [...keywordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([keyword, count]) => ({ keyword, count }));
  const topFonts = [...fontCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([fontFamily, count]) => ({ fontFamily, count }));

  return {
    eventCount: recentEvents.length,
    topKeywords,
    topFonts,
    recentEvents: recentEvents.slice(-40),
  };
}
