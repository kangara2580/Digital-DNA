"use client";

import Link from "next/link";
import { useSitePreferences } from "@/context/SitePreferencesContext";
import { useTranslation } from "@/hooks/useTranslation";
import type { SiteLocale } from "@/lib/sitePreferences";

function formatDetailDate(value: string, locale: SiteLocale): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  if (locale === "en") {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  }
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}년 ${m}월 ${day}일`;
}

type Props = {
  title: string;
  createdAt: string;
  bodyParagraphs: string[];
  imageUrls: string[];
};

export function NoticeDetailClient({ title, createdAt, bodyParagraphs, imageUrls }: Props) {
  const { t } = useTranslation();
  const { locale } = useSitePreferences();
  const loc = locale as SiteLocale;

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-snug tracking-tight text-zinc-100 sm:text-2xl [html[data-theme='light']_&]:text-zinc-900">
        {title}
      </h2>
      <p className="mt-2 font-mono text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
        <time dateTime={createdAt}>{formatDetailDate(createdAt, loc)}</time>
      </p>

      <article className="mt-8 space-y-5 border-t border-white/10 pt-8 text-[15px] leading-[1.85] text-zinc-300 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700">
        {bodyParagraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-wrap">
            {p}
          </p>
        ))}
      </article>

      {imageUrls.length > 0 ? (
        <section className="mt-8 space-y-3 border-t border-white/10 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h3 className="text-[13px] font-semibold text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">
            {t("notice.attachments")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {imageUrls.map((url, idx) => (
              <a
                key={`${url}-${idx}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg border border-white/10 [html[data-theme='light']_&]:border-zinc-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- external attachment URLs */}
                <img
                  src={url}
                  alt={t("notice.imageAlt", { n: idx + 1 })}
                  className="h-full w-full object-cover"
                />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <p className="mt-10">
        <Link
          href="/notice"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white px-3 py-2 text-[13px] font-semibold text-zinc-900 transition hover:opacity-90 [html[data-theme='light']_&]:border-zinc-300"
        >
          {t("notice.backToList")}
        </Link>
      </p>
    </div>
  );
}
