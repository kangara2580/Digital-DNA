const LOCAL_SAMPLE_POSTER_RE = /^\/videos\/.+\.jpg$/i;

export function sanitizePosterSrc(poster?: string | null): string | undefined {
  const value = poster?.trim();
  if (!value) return undefined;
  if (LOCAL_SAMPLE_POSTER_RE.test(value)) return undefined;
  return value;
}
