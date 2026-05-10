"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useSitePreferences } from "@/context/SitePreferencesContext";
import { SUPPORT_FAQ_ITEMS, supportFaqCategoryLabel } from "@/lib/i18n/supportFaqContent";
import type { SiteLocale } from "@/lib/sitePreferences";

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function SupportCenterPageClient() {
  const { t } = useTranslation();
  const { locale } = useSitePreferences();
  const loc = locale as SiteLocale;
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const debouncedQuery = useDebouncedValue(query, 300);
  const normalized = debouncedQuery.trim().toLowerCase();

  const faqRows = useMemo(() => {
    return SUPPORT_FAQ_ITEMS.map((item) => ({
      ...item,
      question: item.question[loc],
      answer: item.answer[loc],
      categoryLabel: supportFaqCategoryLabel(loc, item.category),
    }));
  }, [loc]);

  const filtered = useMemo(() => {
    if (!normalized) return faqRows;
    return faqRows.filter((f) => (f.question + f.answer).toLowerCase().includes(normalized));
  }, [normalized, faqRows]);

  const ordered = useMemo(() => {
    const popular = filtered.filter((f) => f.popular);
    const others = filtered.filter((f) => !f.popular);
    return [...popular, ...others];
  }, [filtered]);

  return (
    <section className="space-y-8 px-2 pb-10 sm:px-0">
      <header className="px-1 py-2">
        <h1 className="text-[clamp(1.45rem,3.4vw,2.1rem)] font-extrabold tracking-tight text-white [html[data-theme='light']_&]:text-zinc-900">
          {t("support.title")}
        </h1>
      </header>

      <section className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
        <h2 className="text-[clamp(1.35rem,3.2vw,1.8rem)] font-extrabold text-white [html[data-theme='light']_&]:text-zinc-900">
          {t("support.faqHeading")}
        </h2>
        <p className="mt-2 text-[13px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          {t("support.faqLead")}
        </p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("support.searchPh")}
          className="mt-4 w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-[14px] text-zinc-100 placeholder:text-zinc-500 focus:border-white/40 focus:outline-none [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:text-zinc-900"
        />
        <div className="mt-4 divide-y divide-white/10 border-y border-white/10 [html[data-theme='light']_&]:divide-zinc-200 [html[data-theme='light']_&]:border-zinc-200">
          {ordered.map((f) => {
            const opened = openId === f.id;
            return (
              <div key={f.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(opened ? null : f.id)}
                  className="flex w-full items-start justify-between gap-3 px-2 py-3 text-left"
                >
                  <span className="text-[14px] font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                    {f.popular ? "🔥 " : ""}
                    <span className="mr-2 text-[11px] font-medium text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                      [{f.categoryLabel}]
                    </span>
                    {f.question}
                  </span>
                  <span className="text-zinc-500">{opened ? "−" : "+"}</span>
                </button>
                {opened ? (
                  <div className="px-2 pb-4 text-[13px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
                    {f.answer}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        {ordered.length === 0 ? (
          <p className="mt-4 text-[13px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            {t("support.noResults")}
          </p>
        ) : null}
      </section>

      <section className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
        <h2 className="text-base font-bold text-white [html[data-theme='light']_&]:text-zinc-900">
          {t("support.contactHeading")}
        </h2>
        <p className="mt-2 text-[14px] text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
          {t("support.emailLabel")}{" "}
          <span className="font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            support@ara.com
          </span>
        </p>
        <p className="mt-1 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          {t("support.emailLead")}
        </p>
      </section>
    </section>
  );
}
