import { BestPurchaseReviewsSection } from "@/components/BestPurchaseReviewsSection";
import { Highlight24 } from "@/components/Highlight24";
import { TrendingRankSection } from "@/components/TrendingRankSection";
import { SellerPitchBanner, SellerPitchBottomStartButton } from "@/components/SellerPitchBanner";
import { DiscountDnaSection } from "@/components/DiscountDnaSection";

export default async function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden md:-ml-[var(--reels-rail-w)] md:w-[calc(100%+var(--reels-rail-w))]">
      <main className="relative z-10 min-w-0 pb-28 pt-0 sm:pb-32">
        <Highlight24 />
        <TrendingRankSection />
        <DiscountDnaSection />
        <SellerPitchBanner showStartButton={false} />
        <BestPurchaseReviewsSection />
        <SellerPitchBottomStartButton />
      </main>
    </div>
  );
}
