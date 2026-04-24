import Image from "next/image";
import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";

export const metadata = {
  title: "회사소개 — ARA",
  description:
    "Create Faster, Look Better. Explore · Acquire · Transform — Digital DNA 릴스 소스 플랫폼.",
};

/** 디지털·추상 톤 — Unsplash (Acquire/Transform은 이전 URL 404로 교체) */
const IMG_EXPLORE =
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=85&w=1800";
const IMG_ACQUIRE =
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=85&w=1800";
const IMG_TRANSFORM =
  "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=85&w=1800";

const pillars = [
  {
    id: "explore",
    label: "Explore",
    body: "트렌드에 맞춰 큐레이션된 수만 개의 릴스를 탐색하세요.",
    src: IMG_EXPLORE,
    alt: "데이터와 트렌드를 시각화한 디지털 인터페이스 — 탐색·발견",
    chip: "Discover",
  },
  {
    id: "acquire",
    label: "Acquire",
    body: "필요한 소스를 부담 없이, 평생 소유하세요.",
    src: IMG_ACQUIRE,
    alt: "추상적인 디지털 형태와 빛 — 소스 확보·소유",
    chip: "Own",
  },
  {
    id: "transform",
    label: "Transform",
    body: "당신의 감각을 더해, 독보적인 영상으로 완성하세요.",
    src: IMG_TRANSFORM,
    alt: "유동적인 그라데이션과 빛의 흐름 — 변환·완성",
    chip: "Create",
  },
] as const;

export default function AboutPage() {
  return (
    <FooterLegalPageShell
      title="회사소개 (Digital DNA)"
      withCard={false}
      mainMaxClass="max-w-6xl"
    >
      <div className="space-y-16 pb-8 sm:space-y-20 sm:pb-14">
        {/* 상단 슬로건 */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/90 via-black/50 to-reels-cyan/[0.12] p-8 sm:p-12 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:from-zinc-100 [html[data-theme='light']_&]:via-white [html[data-theme='light']_&]:to-reels-cyan/15">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-reels-cyan/25 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-reels-crimson/20 blur-3xl"
            aria-hidden
          />
          <p className="relative font-mono text-[11px] font-bold uppercase tracking-[0.35em] text-reels-cyan/90">
            Digital DNA
          </p>
          <h2 className="relative mt-5 text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
            <span className="block bg-gradient-to-r from-white via-zinc-100 to-reels-cyan/95 bg-clip-text text-transparent [html[data-theme='light']_&]:from-zinc-900 [html[data-theme='light']_&]:via-zinc-800 [html[data-theme='light']_&]:to-reels-cyan">
              Create Faster,
            </span>
            <span className="mt-1 block bg-gradient-to-r from-reels-cyan via-teal-200 to-white/95 bg-clip-text text-transparent [html[data-theme='light']_&]:from-reels-cyan [html[data-theme='light']_&]:via-teal-700 [html[data-theme='light']_&]:to-zinc-800">
              Look Better.
            </span>
          </h2>
        </div>

        {/* 소개 문단 (전폭) */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[17px] font-medium leading-[1.85] text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
            전 세계가 주목하는 릴스 소스를 부담 없이 내 영상에 담아보세요. Digital DNA는 당신의 콘텐츠가 독보적인
            가치를 갖도록 돕습니다.
          </p>
        </div>

        {/* Explore · Acquire · Transform — 스크롤형 3섹션 */}
        <div className="space-y-20 sm:space-y-24">
          {pillars.map((pillar, index) => {
            const imageOnLeft = index % 2 === 0;
            return (
              <section
                key={pillar.id}
                id={pillar.id}
                className="scroll-mt-8"
                aria-labelledby={`about-${pillar.id}-heading`}
              >
                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
                  <div
                    className={`relative min-h-[220px] w-full overflow-hidden rounded-3xl border border-white/10 shadow-[0_0_48px_-14px_rgba(0,242,234,0.28)] sm:min-h-[300px] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:shadow-[0_20px_50px_-24px_rgba(0,0,0,0.12)] ${
                      imageOnLeft ? "" : "lg:col-start-2 lg:row-start-1"
                    }`}
                  >
                    <Image
                      src={pillar.src}
                      alt={pillar.alt}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority={index === 0}
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-tr from-black/45 via-transparent to-reels-cyan/25"
                      aria-hidden
                    />
                    <div className="absolute bottom-4 left-4">
                      <span className="rounded-full border border-white/30 bg-black/50 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white/95 backdrop-blur-md">
                        {pillar.chip}
                      </span>
                    </div>
                  </div>

                  <div className={imageOnLeft ? "" : "lg:col-start-1 lg:row-start-1"}>
                    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-reels-cyan/85">
                      Step {index + 1}
                    </p>
                    <h3
                      id={`about-${pillar.id}-heading`}
                      className="mt-3 text-2xl font-black tracking-tight text-zinc-100 sm:text-3xl [html[data-theme='light']_&]:text-zinc-900"
                    >
                      <span className="text-reels-cyan">{pillar.label}</span>
                      <span className="text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">:</span>
                    </h3>
                    <p className="mt-4 text-[16px] font-medium leading-[1.8] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                      {pillar.body}
                    </p>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </FooterLegalPageShell>
  );
}
