"use client";

import { useSitePreferences } from "@/context/SitePreferencesContext";
import { useTranslation } from "@/hooks/useTranslation";
import type { SiteLocale } from "@/lib/sitePreferences";
import { LICENSE_ARTICLES_EN } from "@/lib/i18n/licensePolicyEn";
import { LICENSE_ARTICLES_KO } from "@/lib/i18n/licensePolicyKo";
import type { PrivacyBlock } from "@/lib/i18n/privacyPolicyKo";

const artCls =
  "border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200";
const h2Cls =
  "text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900";
const pCls =
  "mt-3 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600";
const ulCls =
  "mt-2 space-y-1 pl-4 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600";

function BlockView({ block }: { block: PrivacyBlock }) {
  if (block.type === "p" || block.type === "sub") {
    const cls = block.type === "sub" ? `${pCls} font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-800` : pCls;
    return <p className={cls}>{block.text}</p>;
  }
  return (
    <ul className={ulCls}>
      {block.items.map((item, i) => (
        <li key={i}>• {item}</li>
      ))}
    </ul>
  );
}

export function LicensePolicyBody() {
  const { locale } = useSitePreferences();
  const { t } = useTranslation();
  const loc = locale as SiteLocale;
  const articles = loc === "en" ? LICENSE_ARTICLES_EN : LICENSE_ARTICLES_KO;

  return (
    <section className="space-y-8 px-2 pb-10 sm:px-0">
      <header className="px-1 py-2">
        <h1 className="text-[clamp(1.52rem,3.6vw,2.2rem)] font-extrabold tracking-tight text-white [html[data-theme='light']_&]:text-zinc-900">
          {t("license.page.title")}
        </h1>
      </header>
      {articles.map((article, idx) => (
        <article key={idx} className={artCls}>
          <h2 className={h2Cls}>{article.title}</h2>
          <div className="mt-0 space-y-0 [&>*:first-child]:mt-3">
            {article.blocks.map((b, i) => (
              <BlockView key={i} block={b} />
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
