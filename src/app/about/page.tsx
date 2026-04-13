import Image from "next/image";
import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";

export const metadata = {
  title: "회사소개 — REELS MARKET",
  description:
    "Create Faster, Look Better. Digital DNA — 전 세계가 주목하는 릴스 소스를 당신의 영상에.",
};

/** Unsplash — 편집·제작 워크스테이션 (숏폼·릴스 제작 무드) */
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=85&w=2000";

export default function AboutPage() {
  return (
    <FooterLegalPageShell
      title="회사소개 (Digital DNA)"
      withCard={false}
      mainMaxClass="max-w-6xl"
    >
      <div className="space-y-12">
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

        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="text-[17px] font-medium leading-[1.8] text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
              전 세계가 주목하는 릴스 소스를 부담 없이 내 영상에 담아보세요. Digital DNA는 당신의 콘텐츠가
              독보적인 가치를 갖도록 돕습니다.
            </p>
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/10 shadow-[0_0_60px_-12px_rgba(0,242,234,0.35)] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.12)]">
            <Image
              src={HERO_IMAGE}
              alt="영상 편집과 크리에이티브 작업이 이루어지는 워크스테이션"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            <div
              className="absolute inset-0 bg-gradient-to-tr from-black/55 via-transparent to-reels-cyan/30"
              aria-hidden
            />
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/25 bg-black/45 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white/95 backdrop-blur-md">
                Short-form · Source
              </span>
              <span className="rounded-full border border-white/25 bg-black/45 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white/95 backdrop-blur-md">
                Ready to create
              </span>
            </div>
          </div>
        </div>
      </div>
    </FooterLegalPageShell>
  );
}
