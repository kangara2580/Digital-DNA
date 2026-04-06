import { BestPurchaseReviewsSection } from "@/components/BestPurchaseReviewsSection";
import { BudgetClipsSection } from "@/components/BudgetClipsSection";
import { EditorCurationSection } from "@/components/EditorCurationSection";
import { FailureOopsSection } from "@/components/FailureOopsSection";
import { Highlight24 } from "@/components/Highlight24";
import { TrendingRankSection } from "@/components/TrendingRankSection";
import { SellerPitchBanner } from "@/components/SellerPitchBanner";
import { DiscountDnaSection } from "@/components/DiscountDnaSection";
import { MicroDnaExploreSection } from "@/components/MicroDnaExploreSection";
import { VideoFeed } from "@/components/VideoFeed";

export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <div className="min-h-screen bg-reels-abyss bg-[radial-gradient(ellipse_90%_60%_at_50%_-8%,rgba(255,0,85,0.14),transparent_55%),radial-gradient(ellipse_50%_45%_at_100%_30%,rgba(0,242,234,0.08),transparent_50%),radial-gradient(ellipse_45%_40%_at_0%_80%,rgba(255,0,85,0.06),transparent_45%)]">
      <main className="min-w-0 pb-28 pt-1 sm:pb-32">
        <TrendingRankSection />
        <FailureOopsSection />
        <Highlight24 />
        <DiscountDnaSection />
        <VideoFeed />
        <BudgetClipsSection />
        <EditorCurationSection />
        <SellerPitchBanner />
        <MicroDnaExploreSection />
        <BestPurchaseReviewsSection />
      </main>
    </div>
  );
}
