import Link from "next/link";
import { ArrowRight, Sparkles, Store } from "lucide-react";

export function SellerPitchBanner() {
  return (
    <section
      className="relative border-t border-slate-200/90 bg-white"
      aria-labelledby="seller-pitch-heading"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_60%_at_50%_0%,rgba(15,23,42,0.06),transparent_55%)]" />

      <div className="relative mx-auto max-w-[1800px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200/95 bg-white px-5 py-7 shadow-[0_20px_64px_-28px_rgba(15,23,42,0.22)] sm:px-8 sm:py-8 lg:max-w-5xl lg:px-10 lg:py-8">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-slate-900/[0.04] blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-slate-400/[0.07] blur-3xl"
            aria-hidden
          />

          <div className="relative flex flex-col items-center gap-5 text-center lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:text-left">
            <div className="min-w-0 lg:max-w-[58%] lg:flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 sm:text-[11px]">
                <Sparkles className="h-3 w-3 text-slate-700" strokeWidth={2} aria-hidden />
                판매자 모집
              </span>

              <h2
                id="seller-pitch-heading"
                className="mt-3 text-[22px] font-bold leading-snug tracking-tight text-[#0f172a] sm:mt-3.5 sm:text-[26px] md:text-[28px]"
              >
                <span className="block">폰 속 &apos;망한 영상&apos;,</span>
                <span className="mt-0.5 block text-slate-800 sm:mt-1">
                  누군가에겐 간절한 한 조각
                </span>
              </h2>

              <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed text-slate-600 sm:mt-3 sm:text-[15px]">
                <span className="block">
                  지워두기 아까운 클립을 누군가의 프로젝트에 남겨 보세요.
                </span>
                <span className="mt-1 block sm:mt-1.5">
                  <span className="font-semibold text-slate-800">지금 바로 100원</span>
                  부터 올릴 수 있어요.
                </span>
              </p>
            </div>

            <div className="flex w-full max-w-sm shrink-0 flex-col items-stretch gap-2 lg:w-auto lg:max-w-[min(100%,280px)] lg:items-end">
              <Link
                href="/mypage"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-[14px] font-semibold text-white shadow-[0_6px_24px_-10px_rgba(15,23,42,0.45)] transition-[transform,box-shadow] duration-200 hover:shadow-[0_10px_32px_-10px_rgba(15,23,42,0.5)] active:scale-[0.98] sm:px-7 sm:py-3 sm:text-[15px]"
              >
                <Store className="h-[17px] w-[17px] shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                내 조각 판매 시작하기
                <ArrowRight
                  className="h-[17px] w-[17px] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                  strokeWidth={2.2}
                  aria-hidden
                />
              </Link>
              <p className="text-center text-[11px] leading-snug text-slate-500 sm:text-[12px] lg:text-right">
                가입만 하면 등록 가능 · 심사 후 마켓에 노출
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
