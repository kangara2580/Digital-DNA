import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";

export const metadata = {
  title: "회사소개 — ARA",
  description:
    "더 빠르게 만들고, 더 완성도 높게. 탐색 · 획득 · 변환을 연결하는 Digital DNA 동영상 소스 플랫폼.",
};

export default function AboutPage() {
  return (
    <FooterLegalPageShell
      title="소개"
      withCard={false}
      mainMaxClass="max-w-6xl"
      contentTopClass="-mt-10 sm:-mt-14"
      showBreadcrumb={false}
      showTitle={false}
    >
      <section className="relative overflow-hidden px-6 py-8 text-zinc-100 sm:px-10 sm:py-10">
        <div className="relative mx-auto max-w-5xl">
          <header className="text-center">
            <p className="font-mono text-xs font-bold tracking-[0.32em] text-[#2563eb] sm:text-sm">ABOUT ARA</p>
            <h2 className="mt-4 text-[clamp(1.6rem,4vw,2.7rem)] font-extrabold leading-tight tracking-tight text-white">
              영상의 가치를 자산으로
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-[15px] leading-[1.85] text-zinc-200 sm:text-[16px]">
              누구나 자신의 감각이 담긴 영상을 자유롭게 거래할 수 있도록, 창작자와 수요자를
              가장 직관적인 방식으로 연결합니다.
            </p>
          </header>

          <div className="mx-auto mt-8 h-px w-full max-w-4xl bg-gradient-to-r from-transparent via-white/35 to-transparent" />

          <div className="mt-10 grid gap-4 sm:mt-12 lg:grid-cols-3">
            <article className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-sm transition hover:border-white/30 hover:bg-white/[0.06]">
              <p className="text-xs font-semibold tracking-[0.12em] text-[#60a5fa]">글로벌 네트워크</p>
              <p className="mt-3 text-[17px] font-semibold leading-snug text-white">국경 없는 실시간 마켓플레이스</p>
              <p className="mt-3 text-[14px] leading-relaxed text-zinc-300">
                전 세계 크리에이터와 바이어가 ARA에서 직접 만나 빠르게 거래할 수 있습니다.
              </p>
            </article>
            <article className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-sm transition hover:border-white/30 hover:bg-white/[0.06]">
              <p className="text-xs font-semibold tracking-[0.12em] text-[#60a5fa]">높은 접근성</p>
              <p className="mt-3 text-[17px] font-semibold leading-snug text-white">가장 직관적인 판매 경험</p>
              <p className="mt-3 text-[14px] leading-relaxed text-zinc-300">
                복잡한 절차 없이 누구나 자신의 감각을 자산화할 수 있도록 진입 장벽을 낮췄습니다.
              </p>
            </article>
            <article className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-sm transition hover:border-white/30 hover:bg-white/[0.06]">
              <p className="text-xs font-semibold tracking-[0.12em] text-[#60a5fa]">안전한 거래</p>
              <p className="mt-3 text-[17px] font-semibold leading-snug text-white">신뢰 기반 콘텐츠 거래</p>
              <p className="mt-3 text-[14px] leading-relaxed text-zinc-300">
                창작자의 권리를 존중하고 구매자에게는 명확한 사용 범위를 제시해 안전한 거래를
                지원합니다.
              </p>
            </article>
          </div>

          <div className="mx-auto mt-14 max-w-4xl border-t border-white/20 pt-10 sm:pt-12">
            <h3 className="text-center text-[clamp(1.25rem,3vw,1.85rem)] font-bold tracking-tight text-white">
              미션 · 비전
            </h3>
            <div className="mx-auto mt-8 max-w-3xl space-y-7">
              <article className="rounded-2xl border border-white/15 bg-white/[0.03] px-6 py-5">
                <p className="text-sm font-semibold tracking-[0.06em] text-[#60a5fa]">미션</p>
                <p className="mt-2 text-[15px] leading-relaxed text-zinc-100 sm:text-[16px]">
                  모든 영상의 가치를 발굴하고, 창작자와 수요자를 완벽하게 연결하는 것
                </p>
              </article>
              <article className="rounded-2xl border border-white/15 bg-white/[0.03] px-6 py-5">
                <p className="text-sm font-semibold tracking-[0.06em] text-[#60a5fa]">비전</p>
                <p className="mt-2 text-[15px] leading-relaxed text-zinc-100 sm:text-[16px]">
                  개인의 감각이 자산이 되는 세계 최고의 영상 거래 플랫폼
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>
    </FooterLegalPageShell>
  );
}
