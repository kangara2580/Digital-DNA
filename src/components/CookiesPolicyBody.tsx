"use client";

import { useSitePreferences } from "@/context/SitePreferencesContext";
import { useTranslation } from "@/hooks/useTranslation";
import { COOKIES_POLICY_EN } from "@/lib/i18n/cookiesPolicyEn";
import { COOKIES_POLICY_KO } from "@/lib/i18n/cookiesPolicyKo";
import type { SiteLocale } from "@/lib/sitePreferences";

export function CookiesPolicyBody() {
  const { locale } = useSitePreferences();
  const { t } = useTranslation();
  const loc = locale as SiteLocale;
  const policy = loc === "en" ? COOKIES_POLICY_EN : COOKIES_POLICY_KO;

  return (
    <div className="mt-10 space-y-12">
      <blockquote className="border-l-4 border-reels-cyan/70 pl-5 text-[17px] font-semibold leading-relaxed text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">
        {policy.quote}
      </blockquote>

      <p className="text-[15px] leading-[1.85] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
        {policy.intro}
      </p>

      {policy.sections.map((section) => (
        <section
          key={section.title}
          className="space-y-4 border-t border-white/10 pt-10 [html[data-theme='light']_&]:border-zinc-200"
        >
          <h2 className="text-lg font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            {section.title}{" "}
            {section.subtitle ? (
              <span className="text-[14px] font-semibold text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                {section.subtitle}
              </span>
            ) : null}
          </h2>
          {section.lead ? (
            <p className="text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
              {section.lead}
            </p>
          ) : null}
          {section.items ? (
            <ul className="list-disc space-y-3 pl-5 text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
              {section.items.map((item) => (
                <li key={item.strong}>
                  <strong className="font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
                    {item.strong}
                  </strong>{" "}
                  {item.text}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-[13px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-600">
        {loc === "en" ? (
          <>
            We store theme (
            <code className="rounded bg-black/30 px-1 font-mono text-[12px] [html[data-theme='light']_&]:bg-zinc-200">
              reels-theme
            </code>
            ), language (
            <code className="rounded bg-black/30 px-1 font-mono text-[12px] [html[data-theme='light']_&]:bg-zinc-200">
              reels-locale
            </code>
            ), and whether you unlocked sound on Explore (
            <code className="rounded bg-black/30 px-1 font-mono text-[12px] [html[data-theme='light']_&]:bg-zinc-200">
              reels-explore-audio-unlocked
            </code>
            ) in your browser&apos;s <strong className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-800">local storage</strong> so settings persist on your next visit.{" "}
            {t("cookies.prefs.localeCookieHint")}
          </>
        ) : (
          <>
            현재 사이트는 브라우저{" "}
            <strong className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-800">
              로컬 저장소(localStorage)
            </strong>
            에 테마(
            <code className="rounded bg-black/30 px-1 font-mono text-[12px] [html[data-theme='light']_&]:bg-zinc-200">
              reels-theme
            </code>
            )·언어(
            <code className="rounded bg-black/30 px-1 font-mono text-[12px] [html[data-theme='light']_&]:bg-zinc-200">
              reels-locale
            </code>
            )·탐색 화면에서 소리를 켠 여부(
            <code className="rounded bg-black/30 px-1 font-mono text-[12px] [html[data-theme='light']_&]:bg-zinc-200">
              reels-explore-audio-unlocked
            </code>
            )를 저장해, 상단 메뉴·탐색 설정을 다음 방문 시에도 유지합니다.{" "}
            {t("cookies.prefs.localeCookieHint")}
          </>
        )}
      </p>
    </div>
  );
}
