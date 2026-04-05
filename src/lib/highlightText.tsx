import { Fragment } from "react";

export function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type Props = {
  text: string;
  phrases: string[];
  /** 형광펜 느낌 */
  markClassName?: string;
};

export function HighlightedQuote({
  text,
  phrases,
  markClassName = "rounded-sm bg-amber-200/75 px-0.5 font-semibold text-slate-900 [box-decoration-break:clone]",
}: Props) {
  if (!phrases.length) {
    return <>{text}</>;
  }
  const unique = [...new Set(phrases.filter(Boolean))];
  const sorted = [...unique].sort((a, b) => b.length - a.length);
  const re = new RegExp(`(${sorted.map(escapeRegExp).join("|")})`, "gu");
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) =>
        unique.includes(part) ? (
          <mark key={i} className={markClassName}>
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
