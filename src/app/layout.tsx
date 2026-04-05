import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DnaBuilderDock } from "@/components/DnaBuilderDock";
import { FloatingHelp } from "@/components/FloatingHelp";
import { MallTopNav } from "@/components/MallTopNav";
import { DopamineBasketProvider } from "@/context/DopamineBasketContext";
import { RecentClipsProvider } from "@/context/RecentClipsContext";
import { WishlistProvider } from "@/context/WishlistContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "디지털 DNA — 누구나 사고팔 수 있는 동영상 쇼핑몰",
  description:
    "크리에이터·일상 클립까지. 베스트·세일·트렌드 릴스를 한곳에서. 디지털 DNA에서 영상을 사고팔아 보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} scroll-smooth`}>
      <body className="min-h-screen bg-[#FFFFFF] font-sans text-slate-900 antialiased">
        <WishlistProvider>
          <RecentClipsProvider>
          <DopamineBasketProvider>
            <MallTopNav />
            {children}
            <DnaBuilderDock />
            <FloatingHelp />
          </DopamineBasketProvider>
          </RecentClipsProvider>
        </WishlistProvider>
      </body>
    </html>
  );
}
