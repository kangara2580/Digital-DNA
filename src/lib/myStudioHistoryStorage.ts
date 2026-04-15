const KEY = "reels-my-studio-history-v1";
const MAX_ITEMS = 48;

export type MyStudioHistoryItem = {
  jobId: string;
  videoId: string;
  outputVideoUrl: string;
  createdAtIso: string;
  /** 결과 페이지에서 넘어온 배경 프롬프트 요약(선택) */
  normalizedBackgroundPrompt?: string;
};

function readRaw(): MyStudioHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: MyStudioHistoryItem[] = [];
    for (const x of parsed) {
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
          typeof o.normalizedBackgroundPrompt === "string" ? o.normalizedBackgroundPrompt : undefined,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export function readMyStudioHistory(): MyStudioHistoryItem[] {
  return readRaw().sort((a, b) => {
    const tb = Date.parse(b.createdAtIso) || 0;
    const ta = Date.parse(a.createdAtIso) || 0;
    return tb - ta;
  });
}

export function appendMyStudioHistory(
  item: Omit<MyStudioHistoryItem, "createdAtIso"> & { createdAtIso?: string },
): void {
  if (typeof window === "undefined") return;
  const createdAtIso = item.createdAtIso ?? new Date().toISOString();
  const next: MyStudioHistoryItem = {
    jobId: item.jobId,
    videoId: item.videoId,
    outputVideoUrl: item.outputVideoUrl,
    createdAtIso,
    normalizedBackgroundPrompt: item.normalizedBackgroundPrompt,
  };
  const prev = readRaw();
  const withoutDup = prev.filter((x) => x.jobId !== next.jobId);
  withoutDup.unshift(next);
  const trimmed = withoutDup.slice(0, MAX_ITEMS);
  window.localStorage.setItem(KEY, JSON.stringify(trimmed));
  window.dispatchEvent(new Event("reels-my-studio-updated"));
}
