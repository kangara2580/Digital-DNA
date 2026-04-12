import Link from "next/link";
import { ArrowRight, Sparkles, Store } from "lucide-react";

export function SellerPitchBanner() {
  return (
    <section
      className="relative border-t border-white/10 bg-reels-void/60"
      aria-labelledby="seller-pitch-heading"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_60%_at_50%_0%,rgba(255,0,85,0.12),transparent_55%)]" />

      <div className="relative mx-auto max-w-[1800px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="reels-border-gradient relative mx-auto max-w-4xl overflow-hidden rounded-2xl bg-reels-void/80 px-5 py-7 sm:px-8 sm:py-8 lg:max-w-5xl lg:px-10 lg:py-8">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-reels-crimson/20 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-reels-cyan/15 blur-3xl"
            aria-hidden
          />

          <div className="relative flex flex-col items-center gap-5 text-center lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:text-left">
            <div className="min-w-0 lg:max-w-[58%] lg:flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-reels-cyan/35 bg-reels-cyan/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-reels-cyan sm:text-[11px]">
                <Sparkles className="h-3 w-3" strokeWidth={2} aria-hidden />
                판매자 모집
              </span>

              <h2
                id="seller-pitch-heading"
                className="mt-3 text-[22px] font-extrabold leading-snug tracking-tight text-zinc-100 sm:mt-3.5 sm:text-[26px] md:text-[28px]"
              >
                <span className="block">폰 속 &apos;망한 영상&apos;,</span>
                <span className="mt-0.5 block text-zinc-400 sm:mt-1">
                  누군가에겐 간절한 한 조각
                </span>
              </h2>

              <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed text-zinc-500 sm:mt-3 sm:text-[15px]">
                <span className="block">
                  지워두기 아까운 클립을 누군가의 프로젝트에 남겨 보세요.
                </span>
                <span className="mt-1 block sm:mt-1.5">
                  <span className="font-bold text-reels-cyan">지금 바로 100원</span>
                  부터 올릴 수 있어요.
                </span>
              </p>
            </div>

            <div className="flex w-full max-w-sm shrink-0 flex-col items-stretch gap-2 lg:w-auto lg:max-w-[min(100%,280px)] lg:items-end">
              <Link
                href="/sell"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-reels-crimson px-6 py-3 text-[14px] font-extrabold text-white shadow-reels-crimson transition-[transform,box-shadow] duration-[400ms] ease-in-out hover:brightness-110 active:scale-[0.98] sm:px-7 sm:py-3 sm:text-[15px]"
              >
                <Store className="h-[17px] w-[17px] shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                내 조각 판매 시작하기
                <ArrowRight
                  className="h-[17px] w-[17px] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                  strokeWidth={2.2}
                  aria-hidden
                />
              </Link>
              <p className="text-center text-[11px] leading-snug text-zinc-600 sm:text-[12px] lg:text-right">
                가입만 하면 등록 가능 · 심사 후 마켓에 노출
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
