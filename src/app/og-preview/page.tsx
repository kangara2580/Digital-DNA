import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { OgDefaultArtwork } from "@/components/og/OgDefaultArtwork";

export const metadata: Metadata = {
  title: "OG 미리보기 (적용 전)",
  robots: { index: false, follow: false },
};

const OG_PNG = "/og/ara-og-default.png";
const OG_KAKAO = "/og/ara-og-kakao.png";

const TITLE = "ARA — 숏폼 영상 마켓 / AI 리스킨 / 글로벌 거래";
const DESC = "큐레이션 숏폼 영상 마켓. 베스트셀러·플래시 세일·무드별 추천.";
const URL = "https://ara.pink";

function OgThumb({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-white ${className}`}>
      <div className="absolute inset-0">
        <OgDefaultArtwork />
      </div>
    </div>
  );
}

function PreviewCard({
  platform,
  children,
}: {
  platform: string;
  children: ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_12px_40px_-16px_rgba(0,0,0,0.15)]">
      <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-2.5">
        <p className="text-[13px] font-bold text-zinc-800">{platform}</p>
      </div>
      <div className="p-4">{children}</div>
    </article>
  );
}

export default function OgPreviewPage() {
  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-10 text-zinc-900 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#FF2D8D]">
          적용됨 · site 메타 연동
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">OG / SNS 공유 미리보기</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-zinc-600">
          아래는 링크 공유 시 각 앱에서 보이는 형태를 <strong>시뮬레이션</strong>한
          화면입니다. 실제 카카오·문자는 캐시·도메인 검증 후 약간 다를 수 있습니다.
          루트 <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-[13px]">layout</code>·
          <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-[13px]">socialMetadata</code>에
          OG 이미지·제목·설명이 연결되어 있습니다.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex text-[14px] font-semibold text-[#FF2D8D] hover:underline"
        >
          ← 홈으로
        </Link>

        <section className="mt-10">
          <h2 className="text-lg font-bold">OG 이미지 원본 (1200×630)</h2>
          <p className="mt-1 text-[14px] text-zinc-600">
            흰 배경 · 로고+ARA 정중앙 (v5) · 링크 제목/설명은 아래 카드 참고
          </p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 shadow-lg">
            <OgDefaultArtwork />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={OG_PNG}
              className="overflow-hidden rounded-lg border border-zinc-200 shadow"
              title="1200x630 PNG"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={OG_PNG} alt="OG PNG 1200x630" className="h-auto w-[280px]" />
            </a>
            <a
              href={OG_KAKAO}
              className="overflow-hidden rounded-lg border border-zinc-200 shadow"
              title="800x420 카카오용"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={OG_KAKAO} alt="OG PNG 카카오" className="h-auto w-[240px]" />
            </a>
          </div>
        </section>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <PreviewCard platform="카카오톡 · 링크 미리보기">
            <div className="max-w-[320px] overflow-hidden rounded-lg border border-[#E8E8E8] bg-[#F9F9F9]">
              <OgThumb className="aspect-[1.91/1] w-full" />
              <div className="space-y-1 px-3 py-2.5">
                <p className="text-[11px] font-medium text-[#888]">ara.pink</p>
                <p className="line-clamp-2 text-[15px] font-bold leading-snug text-[#111]">
                  {TITLE}
                </p>
                <p className="line-clamp-2 text-[13px] leading-snug text-[#666]">{DESC}</p>
              </div>
            </div>
          </PreviewCard>

          <PreviewCard platform="문자(SMS) · 링크 미리보기">
            <div className="max-w-[300px]">
              <div className="rounded-2xl rounded-bl-md bg-[#E9E9EB] px-3 py-2.5 text-[15px] leading-snug text-[#111]">
                <span className="text-[#007AFF]">{URL}</span>
              </div>
              <div className="mt-2 overflow-hidden rounded-2xl rounded-tl-md border border-[#D1D1D6] bg-white">
                <OgThumb className="h-[140px] w-full" />
                <div className="border-t border-[#E5E5EA] px-3 py-2">
                  <p className="text-[12px] font-semibold text-[#8E8E93]">ARA</p>
                  <p className="mt-0.5 line-clamp-2 text-[14px] font-semibold text-[#000]">
                    {TITLE}
                  </p>
                  <p className="line-clamp-2 text-[12px] text-[#8E8E93]">{DESC}</p>
                </div>
              </div>
            </div>
          </PreviewCard>

          <PreviewCard platform="Facebook / Meta · Open Graph">
            <div className="max-w-[360px] overflow-hidden rounded border border-[#DADDE1] bg-white">
              <OgThumb className="aspect-[1.91/1] w-full" />
              <div className="border-t border-[#DADDE1] bg-[#F0F2F5] px-3 py-2">
                <p className="text-[11px] uppercase text-[#65676B]">ARA.PINK</p>
                <p className="mt-1 line-clamp-2 text-[16px] font-bold leading-snug text-[#050505]">
                  {TITLE}
                </p>
                <p className="mt-1 line-clamp-2 text-[13px] text-[#65676B]">{DESC}</p>
              </div>
            </div>
          </PreviewCard>

          <PreviewCard platform="X (Twitter) · summary_large_image">
            <div className="max-w-[360px] overflow-hidden rounded-2xl border border-[#2F3336] bg-black">
              <OgThumb className="aspect-[1.91/1] w-full" />
              <div className="border-t border-[#2F3336] px-3 py-2.5">
                <p className="text-[13px] text-[#71767B]">ara.pink</p>
                <p className="mt-0.5 line-clamp-2 text-[15px] font-bold text-[#E7E9EA]">
                  {TITLE}
                </p>
                <p className="line-clamp-2 text-[14px] text-[#71767B]">{DESC}</p>
              </div>
            </div>
          </PreviewCard>

          <PreviewCard platform="Slack · 링크 unfurl">
            <div className="max-w-[360px] overflow-hidden rounded border border-[#DDDDDD] bg-white">
              <OgThumb className="h-[160px] w-full" />
              <div className="border-l-4 border-[#FF2D8D] px-3 py-2">
                <p className="text-[15px] font-bold text-[#1D1C1D]">{TITLE}</p>
                <p className="mt-1 line-clamp-2 text-[13px] text-[#616061]">{DESC}</p>
                <p className="mt-1 text-[12px] text-[#1264A3]">ara.pink</p>
              </div>
            </div>
          </PreviewCard>

          <PreviewCard platform="Discord · embed">
            <div className="max-w-[360px] rounded-sm border-l-4 border-[#FF2D8D] bg-[#2B2D31] px-3 py-2">
              <p className="text-[13px] font-semibold text-[#00A8FC]">{URL}</p>
              <div className="mt-2 overflow-hidden rounded-md">
                <OgThumb className="aspect-[17/9] max-h-[200px] w-full" />
              </div>
              <p className="mt-2 text-[16px] font-bold text-[#F2F3F5]">{TITLE}</p>
              <p className="mt-1 line-clamp-3 text-[14px] text-[#DBDEE1]">{DESC}</p>
            </div>
          </PreviewCard>

          <PreviewCard platform="LinkedIn · 링크 미리보기">
            <div className="max-w-[360px] overflow-hidden rounded-lg border border-[#E0E0E0] bg-white">
              <OgThumb className="aspect-[1.91/1] w-full" />
              <div className="px-3 py-2.5">
                <p className="text-[12px] text-[#666]">ara.pink</p>
                <p className="mt-1 line-clamp-2 text-[14px] font-semibold text-[#000000E6]">
                  {TITLE}
                </p>
              </div>
            </div>
          </PreviewCard>

          <PreviewCard platform="iMessage · Rich Link (macOS)">
            <div className="max-w-[320px] overflow-hidden rounded-xl border border-[#C7C7CC] bg-white shadow-sm">
              <OgThumb className="h-[150px] w-full" />
              <div className="px-3 py-2">
                <p className="text-[11px] font-medium text-[#8E8E93]">ARA.PINK</p>
                <p className="text-[14px] font-semibold leading-snug text-[#000]">{TITLE}</p>
              </div>
            </div>
          </PreviewCard>
        </div>

        <section className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-[14px] text-emerald-950">
          <p className="font-bold">적용 완료 (#8)</p>
          <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
            <li>
              OG 이미지: <code>{OG_PNG}</code> · 제목: <code>meta.rootTitle</code>
            </li>
            <li>카카오: Kakao Developers에 도메인 등록 후 캐시 갱신 시 미리보기 반영</li>
            <li>
              배포 URL이 <code>NEXT_PUBLIC_SITE_URL</code>과 일치해야 공유 미리보기 정상
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
