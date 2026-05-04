import { BestPurchaseReviewsSection } from "@/components/BestPurchaseReviewsSection";
import { Highlight24 } from "@/components/Highlight24";
import { TrendingRankSection } from "@/components/TrendingRankSection";
import { SellerPitchBanner, SellerPitchBottomStartButton } from "@/components/SellerPitchBanner";
import { DiscountDnaSection } from "@/components/DiscountDnaSection";

export default async function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <main className="relative z-10 min-w-0 pb-28 pt-0 sm:pb-32">
        {/* 홈만: 투명 레일 위 풀 블리드 히어로 — 인기순위 이하는 본문 패딩(레일 폭) 유지 */}
        <div className="md:-ml-[var(--reels-rail-w)] md:w-[calc(100%+var(--reels-rail-w))]">
          <Highlight24 />
        </div>
        <TrendingRankSection />
        <DiscountDnaSection />
        <SellerPitchBanner showStartButton={false} />
        <BestPurchaseReviewsSection />
        <SellerPitchBottomStartButton />
      </main>
    </div>
  );
}
