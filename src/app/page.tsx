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
import { MainBackgroundVideo } from "@/components/MainBackgroundVideo";

export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <div className="min-h-screen bg-transparent">
      {/* 메인 화면 배경 영상을 전역으로 깔고, 하단 버튼으로 테마를 바꿉니다. */}
      <MainBackgroundVideo />
      <main className="relative z-10 min-w-0 pb-28 pt-1 sm:pb-32">
        <TrendingRankSection />
        <Highlight24 />
        <FailureOopsSection />
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
