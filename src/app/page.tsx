import { BestPurchaseReviewsSection } from "@/components/BestPurchaseReviewsSection";
import { Highlight24 } from "@/components/Highlight24";
import { TrendingRankSection } from "@/components/TrendingRankSection";
import { SellerPitchBanner } from "@/components/SellerPitchBanner";
import { DiscountDnaSection } from "@/components/DiscountDnaSection";

export default async function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <div className="absolute -left-24 -top-24 h-[22rem] w-[22rem] rounded-full bg-[#8b1f3f]/45 blur-3xl" />
        <div className="absolute right-[-7rem] top-[18%] h-[24rem] w-[24rem] rounded-full bg-[#083a4a]/35 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[22%] h-[20rem] w-[20rem] rounded-full bg-[#321a46]/35 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#05070f_0%,#0b1221_44%,#0b2430_100%)] opacity-90" />
      </div>
      <main className="relative z-10 min-w-0 pb-28 pt-0 sm:pb-32">
        <Highlight24 />
        <TrendingRankSection />
        <DiscountDnaSection />
        <SellerPitchBanner />
        <BestPurchaseReviewsSection />
      </main>
    </div>
  );
}
