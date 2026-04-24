import {
  Infinity as InfinityIcon,
  Layers,
  Scissors,
  Share2,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";

export const metadata = {
  title: "라이선스 규정 — ARA",
  description:
    "Digital DNA — 한 번의 소유로 만드는 무한한 가치. Free to Create & Rules for Respect.",
};

const freeItems = [
  {
    icon: TrendingUp,
    title: "Commercial Use",
    body: "유튜브, 인스타그램, 틱톡 등 모든 SNS에서 수익 창출이 가능합니다.",
  },
  {
    icon: Scissors,
    title: "Unlimited Edit",
    body: "자르고, 붙이고, 재가공하여 당신만의 독창적인 릴스를 완성하세요.",
  },
  {
    icon: InfinityIcon,
    title: "Lifetime Ownership",
    body: "한 번 구매한 소스는 기간 제한 없이 평생 소유하고 사용할 수 있습니다.",
  },
] as const;

const rulesItems = [
  {
    icon: Share2,
    title: "No Resale",
    body: "다운로드한 원본 파일을 수정 없이 그대로 재판매하거나 유료 사이트에 공유할 수 없습니다.",
  },
  {
    icon: Users,
    title: "No Exclusive Rights",
    body: "여러 크리에이터가 함께 사용하는 소스이므로, 특정 소스에 대한 독점적 저작권을 주장할 수 없습니다.",
  },
] as const;

export default function LicensePage() {
  return (
    <FooterLegalPageShell title="라이선스 규정" withCard={false} mainMaxClass="max-w-6xl">
      <div className="space-y-14">
        {/* 히어로: 그라데이션 타이포 */}
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/80 via-black/40 to-reels-cyan/[0.1] p-8 sm:p-10 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:from-zinc-50 [html[data-theme='light']_&]:via-white [html[data-theme='light']_&]:to-reels-cyan/10">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-reels-cyan/20 blur-3xl"
              aria-hidden
            />
            <p className="relative font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-reels-cyan/90">
              License
            </p>
            <h2 className="relative mt-4 text-2xl font-black leading-snug tracking-tight text-zinc-100 sm:text-3xl md:text-[1.65rem] [html[data-theme='light']_&]:text-zinc-900">
              <span className="bg-gradient-to-r from-white via-zinc-100 to-reels-cyan/90 bg-clip-text text-transparent [html[data-theme='light']_&]:from-zinc-900 [html[data-theme='light']_&]:via-zinc-800 [html[data-theme='light']_&]:to-reels-cyan">
                한 번의 소유로 만드는 무한한 가치,
              </span>
              <br />
              <span className="mt-1 inline-block bg-gradient-to-r from-reels-cyan to-teal-200/95 bg-clip-text text-transparent [html[data-theme='light']_&]:from-reels-cyan [html[data-theme='light']_&]:to-teal-700">
                Digital DNA 라이선스
              </span>
            </h2>
          </div>
        </div>

        {/* 1. Free to Create */}
        <section
          className="rounded-3xl border border-reels-cyan/25 bg-gradient-to-b from-reels-cyan/[0.07] to-transparent p-6 sm:p-8 [html[data-theme='light']_&]:border-reels-cyan/30 [html[data-theme='light']_&]:from-reels-cyan/10"
          aria-labelledby="license-free-heading"
        >
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-reels-cyan/20 text-reels-cyan">
              <Sparkles className="h-6 w-6" strokeWidth={1.75} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                id="license-free-heading"
                className="text-xl font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
              >
                Free to Create{" "}
                <span className="text-[15px] font-semibold text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                  (권장 사항)
                </span>
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                당신의 창의력을 제한 없이 펼치세요.
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {freeItems.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-black/25 p-5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-reels-cyan/15 text-reels-cyan">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="font-mono text-[12px] font-bold uppercase tracking-wide text-reels-cyan/95">
                  {title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Rules for Respect */}
        <section
          className="rounded-3xl border border-reels-crimson/25 bg-gradient-to-b from-reels-crimson/[0.06] to-transparent p-6 sm:p-8 [html[data-theme='light']_&]:border-reels-crimson/25 [html[data-theme='light']_&]:from-reels-crimson/8"
          aria-labelledby="license-rules-heading"
        >
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-reels-crimson/20 text-reels-crimson">
              <Shield className="h-6 w-6" strokeWidth={1.75} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                id="license-rules-heading"
                className="text-xl font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
              >
                Rules for Respect{" "}
                <span className="text-[15px] font-semibold text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                  (금지 사항)
                </span>
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                건강한 크리에이티브 생태계를 위해 이것만은 지켜주세요.
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {rulesItems.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex gap-4 rounded-2xl border border-white/10 bg-black/25 p-5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-reels-crimson/15 text-reels-crimson">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>
                <div>
                  <h3 className="font-mono text-[12px] font-bold uppercase tracking-wide text-reels-crimson/95">
                    {title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 추가: 플랫폼 정책 준수 — 크리에이터 보호에 실질적으로 필요 */}
        <section
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-7 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50"
          aria-labelledby="license-extra-heading"
        >
          <div className="flex gap-3">
            <Layers className="mt-0.5 h-5 w-5 shrink-0 text-reels-cyan" strokeWidth={1.75} aria-hidden />
            <div>
              <h3
                id="license-extra-heading"
                className="text-[15px] font-bold text-zinc-200 [html[data-theme='light']_&]:text-zinc-900"
              >
                플랫폼 정책과 함께
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                본 라이선스와 더불어, 유튜브·인스타그램·틱톡 등 각 서비스의 이용약관·커뮤니티 가이드라인·저작권 정책을
                반드시 준수해 주세요. Digital DNA 소스는 창작에 사용하는 재료이며, 타 플랫폼 규칙 위반으로 인한
                책임은 이용자에게 있습니다.
              </p>
            </div>
          </div>
        </section>
      </div>
    </FooterLegalPageShell>
  );
}
