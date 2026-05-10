"use client";

import { useTranslation } from "@/hooks/useTranslation";

export function AboutPageBody() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden px-6 py-8 text-zinc-100 sm:px-10 sm:py-10">
      <div className="relative mx-auto max-w-5xl">
        <header className="text-center">
          <p className="font-mono text-xs font-bold tracking-[0.32em] text-[#2563eb] sm:text-sm">
            {t("about.kicker")}
          </p>
          <h2 className="mt-4 text-[clamp(1.6rem,4vw,2.7rem)] font-extrabold leading-tight tracking-tight text-white">
            {t("about.hero.title")}
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-[15px] leading-[1.85] text-zinc-200 sm:text-[16px]">
            {t("about.hero.lead")}
          </p>
        </header>

        <div className="mx-auto mt-8 h-px w-full max-w-4xl bg-gradient-to-r from-transparent via-white/35 to-transparent" />

        <div className="mt-10 grid gap-4 sm:mt-12 lg:grid-cols-3">
          <article className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-sm transition hover:border-white/30 hover:bg-white/[0.06]">
            <p className="text-xs font-semibold tracking-[0.12em] text-[#60a5fa]">{t("about.card1.tag")}</p>
            <p className="mt-3 text-[17px] font-semibold leading-snug text-white">{t("about.card1.title")}</p>
            <p className="mt-3 text-[14px] leading-relaxed text-zinc-300">{t("about.card1.body")}</p>
          </article>
          <article className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-sm transition hover:border-white/30 hover:bg-white/[0.06]">
            <p className="text-xs font-semibold tracking-[0.12em] text-[#60a5fa]">{t("about.card2.tag")}</p>
            <p className="mt-3 text-[17px] font-semibold leading-snug text-white">{t("about.card2.title")}</p>
            <p className="mt-3 text-[14px] leading-relaxed text-zinc-300">{t("about.card2.body")}</p>
          </article>
          <article className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-sm transition hover:border-white/30 hover:bg-white/[0.06]">
            <p className="text-xs font-semibold tracking-[0.12em] text-[#60a5fa]">{t("about.card3.tag")}</p>
            <p className="mt-3 text-[17px] font-semibold leading-snug text-white">{t("about.card3.title")}</p>
            <p className="mt-3 text-[14px] leading-relaxed text-zinc-300">{t("about.card3.body")}</p>
          </article>
        </div>

        <div className="mx-auto mt-14 max-w-4xl border-t border-white/20 pt-10 sm:pt-12">
          <h3 className="text-center text-[clamp(1.25rem,3vw,1.85rem)] font-bold tracking-tight text-white">
            {t("about.mv.heading")}
          </h3>
          <div className="mx-auto mt-8 max-w-3xl space-y-7">
            <article className="rounded-2xl border border-white/15 bg-white/[0.03] px-6 py-5">
              <p className="text-sm font-semibold tracking-[0.06em] text-[#60a5fa]">{t("about.mv.missionLabel")}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-zinc-100 sm:text-[16px]">
                {t("about.mv.missionBody")}
              </p>
            </article>
            <article className="rounded-2xl border border-white/15 bg-white/[0.03] px-6 py-5">
              <p className="text-sm font-semibold tracking-[0.06em] text-[#60a5fa]">{t("about.mv.visionLabel")}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-zinc-100 sm:text-[16px]">
                {t("about.mv.visionBody")}
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}