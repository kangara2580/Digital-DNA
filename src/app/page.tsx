import { BestPurchaseReviewsSection } from "@/components/BestPurchaseReviewsSection";
import { BudgetClipsSection } from "@/components/BudgetClipsSection";
import { EditorCurationSection } from "@/components/EditorCurationSection";
import { FailureOopsSection } from "@/components/FailureOopsSection";
import { FloatingHuntersBar } from "@/components/FloatingHuntersBar";
import { Highlight24 } from "@/components/Highlight24";
import { TrendingRankSection } from "@/components/TrendingRankSection";
import { SellerPitchBanner } from "@/components/SellerPitchBanner";
import { VideoFeed } from "@/components/VideoFeed";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <main className="min-w-0 pb-28 pt-1 sm:pb-32">
        <TrendingRankSection />
        <FailureOopsSection />
        <Highlight24 />
        <VideoFeed />
        <BudgetClipsSection />
        <EditorCurationSection />
        <BestPurchaseReviewsSection />
        <SellerPitchBanner />
        <FloatingHuntersBar />
      </main>
    </div>
  );
}
