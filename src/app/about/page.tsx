import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";

export const metadata = {
  title: "회사소개 — ARA",
  description:
    "Create Faster, Look Better. Explore · Acquire · Transform — Digital DNA 릴스 소스 플랫폼.",
};

export default function AboutPage() {
  return (
    <FooterLegalPageShell
      title="소개"
      withCard={false}
      mainMaxClass="max-w-6xl"
    >
      <section className="relative overflow-hidden px-6 py-12 text-zinc-100 sm:px-10 sm:py-16">

        <div className="relative mx-auto max-w-4xl">
          <header className="text-center">
            <p className="font-mono text-sm font-bold tracking-[0.4em] text-[#8fb2ff]">ARA</p>
            <h2 className="mt-5 text-[clamp(1.45rem,3.8vw,2.4rem)] font-extrabold leading-tight tracking-tight text-white">
              영상의 가치를 전 세계의 자산으로
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-[15px] leading-[1.9] text-zinc-200 sm:text-[16px]">
              우리는 누구나 자신의 감각이 담긴 영상을 자유롭게 거래하는 생태계를 만듭니다. 복잡한 과정은 생략하고,
              당신이 기록한 찰나의 순간을 전 세계가 기다리는 완벽한 콘텐츠로 연결합니다.
            </p>
            <div className="mx-auto mt-7 h-1 w-28 rounded-full bg-[#6f8fff]" />
          </header>

          <div className="mt-12 grid gap-8 sm:mt-14 lg:grid-cols-3">
            <article className="rounded-2xl border border-white/12 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9ec0ff]">Global Network</p>
              <p className="mt-3 text-[15px] leading-relaxed text-zinc-100">국경 없는 실시간 마켓플레이스.</p>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-300">
                전 세계 크리에이터와 바이어가 ARA에서 직접 만납니다.
              </p>
            </article>
            <article className="rounded-2xl border border-white/12 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9ec0ff]">High Accessibility</p>
              <p className="mt-3 text-[15px] leading-relaxed text-zinc-100">가장 직관적인 판매 경험.</p>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-300">
                누구나 자신의 감각을 자산화할 수 있도록 기술적 장벽을 허뭅니다.
              </p>
            </article>
            <article className="rounded-2xl border border-white/12 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9ec0ff]">Secure Trade</p>
              <p className="mt-3 text-[15px] leading-relaxed text-zinc-100">신뢰 기반의 콘텐츠 거래.</p>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-300">
                창작자의 권리를 존중하고 구매자에게는 명확한 사용권을 보장합니다.
              </p>
            </article>
          </div>

          <div className="mx-auto mt-12 max-w-3xl border-t border-white/12 pt-10 sm:mt-14">
            <h3 className="text-center text-[clamp(1.08rem,2.8vw,1.45rem)] font-bold tracking-tight text-white">
              Mission &amp; Vision
            </h3>
            <p className="mt-5 text-center text-[15px] leading-relaxed text-zinc-200">
              <span className="font-semibold text-[#8fb2ff]">Mission</span> 모든 영상의 가치를 발굴하고, 창작자와 수요자를
              완벽하게 연결하는 것
            </p>
            <p className="mt-3 text-center text-[15px] leading-relaxed text-zinc-200">
              <span className="font-semibold text-[#8fb2ff]">Vision</span> 개인의 감각이 자산이 되는 세계 최고의 영상 거래
              플랫폼
            </p>
          </div>
        </div>
      </section>
    </FooterLegalPageShell>
  );
}
