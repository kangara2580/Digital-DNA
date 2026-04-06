import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DnaBuilderDock } from "@/components/DnaBuilderDock";
import { FloatingHelp } from "@/components/FloatingHelp";
import { MallTopNav } from "@/components/MallTopNav";
import { ReelsLeftRail } from "@/components/ReelsLeftRail";
import { DopamineBasketProvider } from "@/context/DopamineBasketContext";
import { RecentClipsProvider } from "@/context/RecentClipsContext";
import { WishlistProvider } from "@/context/WishlistContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "REELS MARKET — Buy the Motion, Own the Moment",
  description:
    "모션 권리를 사고 Kling 3.0으로 리스킨하세요. 베스트·플래시 세일·상황 큐레이션 릴스 마켓.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} scroll-smooth`}>
      <body className="min-h-screen bg-reels-abyss font-sans text-zinc-100 antialiased">
        <WishlistProvider>
          <RecentClipsProvider>
          <DopamineBasketProvider>
            <ReelsLeftRail />
            <div className="min-w-0 md:pl-[var(--reels-rail-w)]">
              <MallTopNav />
              {children}
              <DnaBuilderDock />
              <FloatingHelp />
            </div>
          </DopamineBasketProvider>
          </RecentClipsProvider>
        </WishlistProvider>
      </body>
    </html>
  );
}
