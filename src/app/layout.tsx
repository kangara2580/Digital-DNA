/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import {
  Black_Han_Sans,
  Inter,
  Montserrat,
  Nanum_Gothic,
  Song_Myung,
} from "next/font/google";
import { NavigationRecovery } from "@/components/NavigationRecovery";
import { DnaBuilderDock } from "@/components/DnaBuilderDock";
import { FloatingHelp } from "@/components/FloatingHelp";
import { MallTopNav } from "@/components/MallTopNav";
import { ReelsLeftRail } from "@/components/ReelsLeftRail";
import { ReelsMarketFooter } from "@/components/ReelsMarketFooter";
import { SitePreferencesProvider } from "@/context/SitePreferencesContext";
import { DopamineBasketProvider } from "@/context/DopamineBasketContext";
import { PurchasedVideosProvider } from "@/context/PurchasedVideosContext";
import { RecentClipsProvider } from "@/context/RecentClipsContext";
import { WishlistProvider } from "@/context/WishlistContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-montserrat",
});
const blackHanSans = Black_Han_Sans({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-black-han-sans",
});
const nanumGothic = Nanum_Gothic({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-nanum-gothic",
});
const songMyung = Song_Myung({
  weight: "400",
  variable: "--font-song-myung",
});

export const metadata: Metadata = {
  title: "REELS MARKET — Buy the Motion, Own the Moment",
  description:
    "모션 권리를 사고 Kling 3.0으로 리스킨하세요. 베스트·플래시 세일·상황 큐레이션 릴스 마켓.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeBootScript = `
    (function () {
      try {
        var stored = localStorage.getItem("reels-theme");
        var theme = stored === "light" || stored === "dark" ? stored : "dark";
        document.documentElement.dataset.theme = theme;
      } catch (e) {
        document.documentElement.dataset.theme = "dark";
      }
      try {
        var loc = localStorage.getItem("reels-locale");
        document.documentElement.lang = loc === "en" ? "en" : "ko";
      } catch (e2) {
        document.documentElement.lang = "ko";
      }
    })();
  `;

  return (
    <html
      lang="ko"
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${montserrat.variable} ${blackHanSans.variable} ${nanumGothic.variable} ${songMyung.variable}`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+KR:wght@400;500;700;800&family=Oswald:wght@400;600;700&family=Poppins:wght@400;500;700;800&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-screen bg-[var(--background,#02040a)] font-sans text-[var(--foreground,#fafafa)] antialiased">
        <SitePreferencesProvider>
        <WishlistProvider>
          <RecentClipsProvider>
            <DopamineBasketProvider>
              <PurchasedVideosProvider>
                <NavigationRecovery />
                <ReelsLeftRail />
                <div className="min-w-0 md:pl-[var(--reels-rail-w)]">
                  <MallTopNav />
                  {children}
                  <ReelsMarketFooter />
                  <DnaBuilderDock />
                  <FloatingHelp />
                </div>
              </PurchasedVideosProvider>
            </DopamineBasketProvider>
          </RecentClipsProvider>
        </WishlistProvider>
        </SitePreferencesProvider>
      </body>
    </html>
  );
}
