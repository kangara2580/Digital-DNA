import type { SiteLocale } from "@/lib/sitePreferences";

/** Parse `Accept-Language` (quality values) → `ko` | `en`. Defaults to `ko`. */
export function parseAcceptLanguageLocale(
  header: string | null | undefined,
): SiteLocale {
  if (!header?.trim()) return "ko";
  const parts = header
    .split(",")
    .map((p) => {
      const [tagRaw, ...qparts] = p.trim().split(";").map((s) => s.trim());
      const ql = qparts.find((x) => x.toLowerCase().startsWith("q="));
      const q = ql ? Number.parseFloat(ql.slice(2).trim()) : 1;
      const base = (tagRaw || "").split("-")[0]?.toLowerCase() ?? "";
      return { base, q: Number.isFinite(q) ? q : 1 };
    })
    .filter((p) => p.base.length > 0);
  parts.sort((a, b) => b.q - a.q);
  for (const p of parts) {
    if (p.base === "en") return "en";
    if (p.base === "ko") return "ko";
  }
  return "ko";
}
