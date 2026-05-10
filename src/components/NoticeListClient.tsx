"use client";

import Link from "next/link";
import { Pin } from "lucide-react";
import { useSitePreferences } from "@/context/SitePreferencesContext";
import { useTranslation } from "@/hooks/useTranslation";
import type { NoticeRecord } from "@/lib/noticesRepo";
import type { SiteLocale } from "@/lib/sitePreferences";

function formatListDate(value: string, locale: SiteLocale): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if (locale === "en") {
    return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return `${y}. ${String(m).padStart(2, "0")}. ${String(day).padStart(2, "0")}.`;
}

type Props = { rows: NoticeRecord[] };

export function NoticeListClient({ rows }: Props) {
  const { t } = useTranslation();
  const { locale } = useSitePreferences();
  const loc = locale as SiteLocale;

  return (
    <div className="space-y-5">
      <div className="border-b border-white/15 pb-4 [html[data-theme='light']_&]:border-zinc-200">
        <p className="text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          {t("notice.totalCount", { n: rows.length })}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="py-12 text-center text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          {t("notice.empty")}
        </p>
      ) : null}

      <div className="hidden overflow-hidden border-y border-white/15 [html[data-theme='light']_&]:border-zinc-200 sm:block">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-white/10 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-600">
              <th className="w-14 px-4 py-3.5 text-center sm:w-16">{t("notice.colNo")}</th>
              <th className="px-4 py-3.5">{t("notice.colTitle")}</th>
              <th className="w-36 shrink-0 px-4 py-3.5 text-center sm:w-40">{t("notice.colDate")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 [html[data-theme='light']_&]:divide-zinc-200">
            {rows.map((n, index) => (
              <tr
                key={n.id}
                className="group transition-colors hover:bg-white/[0.03] [html[data-theme='light']_&]:hover:bg-zinc-50"
              >
                <td className="p-0 text-center font-mono tabular-nums text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                  <Link href={`/notice/${encodeURIComponent(n.id)}`} className="block px-4 py-4">
                    {n.pinned ? (
                      <span className="inline-flex items-center justify-center" title={t("notice.badgePinnedTitle")}>
                        <Pin className="mx-auto h-4 w-4 text-reels-cyan" strokeWidth={2} aria-hidden />
                        <span className="sr-only">{t("notice.badgePinned")}</span>
                      </span>
                    ) : (
                      rows.length - index
                    )}
                  </Link>
                </td>
                <td className="p-0">
                  <Link
                    href={`/notice/${encodeURIComponent(n.id)}`}
                    className="block px-4 py-4 font-semibold text-zinc-100 transition group-hover:text-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:group-hover:text-zinc-950"
                  >
                    {n.pinned ? (
                      <span className="mr-2 inline-block rounded border border-reels-cyan/35 bg-reels-cyan/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-reels-cyan">
                        {t("notice.badgePinned")}
                      </span>
                    ) : null}
                    {n.title}
                  </Link>
                </td>
                <td className="whitespace-nowrap p-0 text-center font-mono text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                  <Link href={`/notice/${encodeURIComponent(n.id)}`} className="block px-4 py-4">
                    {formatListDate(n.createdAt, loc)}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 sm:hidden" role="list">
        {rows.map((n, index) => (
          <li key={n.id}>
            <Link
              href={`/notice/${encodeURIComponent(n.id)}`}
              className="block border-y border-white/15 px-1 py-4 transition hover:bg-white/[0.03] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:hover:bg-zinc-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {n.pinned ? (
                    <span className="mb-1.5 inline-flex items-center gap-1 rounded border border-reels-cyan/35 bg-reels-cyan/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-reels-cyan">
                      <Pin className="h-3 w-3" aria-hidden />
                      {t("notice.badgePinned")}
                    </span>
                  ) : (
                    <p className="mb-1 font-mono text-[11px] text-zinc-500">#{rows.length - index}</p>
                  )}
                  <p className="font-semibold leading-snug text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                    {n.title}
                  </p>
                </div>
                <time
                  dateTime={n.createdAt}
                  className="shrink-0 font-mono text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600"
                >
                  {formatListDate(n.createdAt, loc)}
                </time>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
