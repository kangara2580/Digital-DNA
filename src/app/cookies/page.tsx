import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";

export const metadata = {
  title: "쿠키 정책 — REELS MARKET",
  description:
    "Digital DNA 쿠키 정책 — Essential, Performance & Insights, Preferences.",
};

export default function CookiesPage() {
  return (
    <FooterLegalPageShell title="쿠키 정책" withCard={false} mainMaxClass="max-w-3xl">
      <div className="mt-10 space-y-12">
        <blockquote className="border-l-4 border-reels-cyan/70 pl-5 text-[17px] font-semibold leading-relaxed text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">
          당신의 창의적 흐름을 기억하고 최적화합니다.
        </blockquote>

        <p className="text-[15px] leading-[1.85] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          Digital DNA는 사용자가 플랫폼을 더 빠르고 쾌적하게 이용할 수 있도록 쿠키(Cookie)를 사용합니다. 쿠키는
          사용자의 브라우저에 저장되는 작은 데이터 조각입니다.
        </p>

        <section className="space-y-4 border-t border-white/10 pt-10 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-lg font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            1. Essential{" "}
            <span className="text-[14px] font-semibold text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              (필수 항목)
            </span>
          </h2>
          <p className="text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            서비스 운영을 위해 반드시 필요한 쿠키입니다.
          </p>
          <ul className="list-disc space-y-3 pl-5 text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            <li>
              <strong className="font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
                Seamless Access:
              </strong>{" "}
              로그인 상태를 유지하고, 페이지를 이동해도 중단 없이 작업을 이어가게 돕습니다.
            </li>
            <li>
              <strong className="font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
                Security &amp; Trust:
              </strong>{" "}
              부정 로그인을 방지하고 사용자의 결제 정보를 안전하게 보호합니다.
            </li>
          </ul>
        </section>

        <section className="space-y-4 border-t border-white/10 pt-10 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-lg font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            2. Performance &amp; Insights{" "}
            <span className="text-[14px] font-semibold text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              (성능 분석)
            </span>
          </h2>
          <p className="text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            더 나은 서비스를 만들기 위한 분석용 쿠키입니다.
          </p>
          <ul className="list-disc space-y-3 pl-5 text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            <li>
              <strong className="font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
                Trend Analysis:
              </strong>{" "}
              어떤 릴스 소스가 가장 인기 있는지 분석하여, 당신의 취향에 맞는 트렌디한 소스를 우선적으로
              추천합니다.
            </li>
            <li>
              <strong className="font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
                Optimized UI:
              </strong>{" "}
              사용자가 사이트 내에서 겪는 불편함을 찾아내어 더 직관적인 디자인으로 개선하는 기초 자료가 됩니다.
            </li>
          </ul>
        </section>

        <section className="space-y-4 border-t border-white/10 pt-10 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-lg font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            3. Preferences{" "}
            <span className="text-[14px] font-semibold text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              (개인화 설정)
            </span>
          </h2>
          <p className="text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            당신의 작업 환경을 기억하는 쿠키입니다.
          </p>
          <ul className="list-disc space-y-3 pl-5 text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            <li>
              <strong className="font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
                Personalized View:
              </strong>{" "}
              다크 모드 설정, 언어 선택 등 당신이 지정한 최적의 작업 환경을 접속할 때마다 그대로 유지해 줍니다.
            </li>
          </ul>
          <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-[13px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-600">
            현재 사이트는 브라우저 <strong className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-800">로컬 저장소(localStorage)</strong>에 테마(
            <code className="rounded bg-black/30 px-1 font-mono text-[12px] [html[data-theme='light']_&]:bg-zinc-200">
              {`reels-theme`}
            </code>
            )·언어(
            <code className="rounded bg-black/30 px-1 font-mono text-[12px] [html[data-theme='light']_&]:bg-zinc-200">
              {`reels-locale`}
            </code>
            )·탐색 화면에서 소리를 켠 여부(
            <code className="rounded bg-black/30 px-1 font-mono text-[12px] [html[data-theme='light']_&]:bg-zinc-200">
              {`reels-explore-audio-unlocked`}
            </code>
            )를 저장해, 상단 메뉴·탐색 설정을 다음 방문 시에도 유지합니다. (UI 번역은 단계적으로 확대할 수
            있습니다.)
          </p>
        </section>
      </div>
    </FooterLegalPageShell>
  );
}
