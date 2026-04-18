export const MY_STUDIO_HISTORY_STORAGE_KEY = "reels-my-studio-history-v1";

const MAX_ITEMS = 48;

export type MyStudioHistoryItem = {
  jobId: string;
  videoId: string;
  outputVideoUrl: string;
  createdAtIso: string;
  normalizedBackgroundPrompt?: string;
};

/** Supabase blob 등에서 복원 */
export function parseStudioHistoryData(data: unknown): MyStudioHistoryItem[] {
  if (!Array.isArray(data)) return [];
  const out: MyStudioHistoryItem[] = [];
  for (const x of data) {
    if (!x || typeof x !== "object") continue;
    const o = x as Partial<MyStudioHistoryItem>;
    if (
      typeof o.jobId !== "string" ||
      typeof o.videoId !== "string" ||
      typeof o.outputVideoUrl !== "string" ||
      typeof o.createdAtIso !== "string"
    ) {
      continue;
    }
    out.push({
      jobId: o.jobId,
      videoId: o.videoId,
      outputVideoUrl: o.outputVideoUrl,
      createdAtIso: o.createdAtIso,
      normalizedBackgroundPrompt:
        typeof o.normalizedBackgroundPrompt === "string"
          ? o.normalizedBackgroundPrompt
          : undefined,
    });
  }
  return out.sort((a, b) => {
    const tb = Date.parse(b.createdAtIso) || 0;
    const ta = Date.parse(a.createdAtIso) || 0;
    return tb - ta;
  });
}

export function trimStudioHistoryItems(items: MyStudioHistoryItem[]): MyStudioHistoryItem[] {
  return items.slice(0, MAX_ITEMS);
}
