import Link from "next/link";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { ArrowRight, Sparkles, Wand2, Zap, PlaySquare } from "lucide-react";
import { MainBackgroundVideo } from "@/components/MainBackgroundVideo";
import { VideoCard } from "@/components/VideoCard";
import { LOCAL_TRENDING_FEED_VIDEOS } from "@/data/videos";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.landing",
    descriptionKey: "meta.landingDescription",
  });
}

export default function LandingPage() {
  const showcaseVideos = LOCAL_TRENDING_FEED_VIDEOS.slice(0, 4);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-reels-cyan selection:text-black">
      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-20 text-center px-4">
        {/* Background Video */}
        <div className="absolute inset-0 z-0 opacity-40">
          <MainBackgroundVideo />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-reels-cyan/30 bg-reels-cyan/10 px-4 py-1.5 text-sm font-semibold text-reels-cyan mb-8 shadow-[0_0_15px_rgba(0,242,234,0.15)]">
            <Sparkles className="h-4 w-4" />
            <span>Digital-DNA 2.0 is live</span>
          </div>
          
          <h1 className="mb-6 text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.1] tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/60">
            Hack social media with <br/>
            <span className="text-reels-cyan drop-shadow-[0_0_25px_rgba(0,242,234,0.3)]">Digital-DNA</span>
          </h1>
          
          <p className="mb-10 max-w-2xl text-lg md:text-xl leading-relaxed text-zinc-400">
            One click to automate your studio-grade AI influencer pipeline.<br/>
            Viral formats, UGC, and more. Join 300+ creators already growing.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/login"
              className="group relative inline-flex w-full sm:w-auto items-center justify-center overflow-hidden rounded-full bg-reels-cyan px-8 py-4 text-base font-extrabold text-black transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,242,234,0.4)]"
            >
              무료로 시작하기
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/explore"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-4 text-base font-bold text-white transition-all hover:bg-white/10 hover:border-white/40"
            >
              마켓 둘러보기
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Simple Steps */}
      <section className="relative z-10 bg-black py-32 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">3 simple steps to your first viral video</h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">더 이상 촬영과 편집에 시간을 낭비하지 마세요.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="reels-glass-card p-8 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-reels-cyan/20 blur-[50px] rounded-full group-hover:bg-reels-cyan/30 transition-colors" />
              <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 border border-white/10">
                <Wand2 className="h-7 w-7 text-reels-cyan" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">1. 아바타 생성 (Persona)</h3>
              <p className="text-zinc-400 leading-relaxed">
                단 몇 초 만에 하이퍼 리얼리즘 페르소나를 디자인하세요. 얼굴, 분위기, 틈새 시장을 선택하기만 하면 됩니다.
              </p>
            </div>

            <div className="reels-glass-card p-8 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-purple-500/20 blur-[50px] rounded-full group-hover:bg-purple-500/30 transition-colors" />
              <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 border border-white/10">
                <PlaySquare className="h-7 w-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">2. 템플릿 선택 (Template)</h3>
              <p className="text-zinc-400 leading-relaxed">
                이미 검증된 바이럴 포맷을 선택하세요. 동영상 마켓에서 가장 인기 있는 구도와 모션을 그대로 가져옵니다.
              </p>
            </div>

            <div className="reels-glass-card p-8 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-reels-crimson/20 blur-[50px] rounded-full group-hover:bg-reels-crimson/30 transition-colors" />
              <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 border border-white/10">
                <Zap className="h-7 w-7 text-reels-crimson" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">3. 합성 및 추출 (Export & Post)</h3>
              <p className="text-zinc-400 leading-relaxed">
                원클릭으로 AI가 합성을 진행합니다. 완성된 스튜디오급 영상을 틱톡, 인스타그램, 유튜브 쇼츠에 바로 업로드하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="border-y border-white/10 bg-black/50 py-24 px-4 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold mb-16">Real results from our creators. <br/><span className="text-zinc-500">Let the numbers talk.</span></h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16">
            <div className="flex flex-col items-center">
              <span className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">73M+</span>
              <span className="text-sm md:text-base font-semibold text-zinc-400 uppercase tracking-widest">Total Views</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl md:text-6xl font-black text-reels-cyan mb-2 tracking-tighter drop-shadow-[0_0_15px_rgba(0,242,234,0.3)]">50K+</span>
              <span className="text-sm md:text-base font-semibold text-zinc-400 uppercase tracking-widest">Followers Gained</span>
            </div>
            <div className="flex flex-col items-center col-span-2 md:col-span-1">
              <span className="text-4xl md:text-6xl font-black text-reels-crimson mb-2 tracking-tighter drop-shadow-[0_0_15px_rgba(228,41,128,0.35)]">$500k+</span>
              <span className="text-sm md:text-base font-semibold text-zinc-400 uppercase tracking-widest">Earnings Generated</span>
            </div>
          </div>
        </div>
      </section>

      {/* Video Showcase Section */}
      <section className="bg-black py-32 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">Stop guessing what goes viral.</h2>
              <p className="text-xl text-zinc-400">
                수백만 개의 동영상을 분석하여 현재 가장 트렌디한 포맷과 훅(Hook)을 제공합니다. 마켓에서 템플릿을 고르고 바로 합성하세요.
              </p>
            </div>
            <Link
              href="/explore"
              className="shrink-0 text-reels-cyan font-bold hover:text-white transition-colors flex items-center gap-2"
            >
              마켓 템플릿 더보기 <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {showcaseVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                reelLayout
                hideHoverActions
                className="transform transition-transform hover:-translate-y-2"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative overflow-hidden border-t border-white/10 bg-zinc-950 py-32 px-4 text-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-reels-cyan/10 blur-[120px] rounded-full pointer-events-none" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Ready to go viral?</h2>
          <p className="text-xl text-zinc-400 mb-12">Your first AI influencer just a few clicks away.</p>
          <Link
            href="/login"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white px-10 py-5 text-lg font-black text-black transition-all hover:scale-105 hover:bg-reels-cyan hover:shadow-[0_0_40px_rgba(0,242,234,0.5)]"
          >
            지금 시작하기
            <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-2" />
          </Link>
        </div>
      </section>
    </div>
  );
}
