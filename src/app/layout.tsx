/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { translate } from "@/lib/i18n/dictionaries";
import { socialMetadataFields } from "@/lib/i18n/socialMetadata";
import { getSiteLocale } from "@/lib/i18n/serverLocale";
import { getSiteMetadataBase } from "@/lib/siteMetadataBase";
import {
  Black_Han_Sans,
  Fredoka,
  Inter,
  Montserrat,
  Nanum_Gothic,
  Song_Myung,
} from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import { GlobalLenis } from "@/components/GlobalLenis";
import { NavigationRecovery } from "@/components/NavigationRecovery";
import { DnaBuilderDock } from "@/components/DnaBuilderDock";
import { FloatingHelp } from "@/components/FloatingHelp";
import { MallTopNav } from "@/components/MallTopNav";
import { RailHomeLogoSvgFilters } from "@/components/RailHomeLogoSvgFilters";
import { ReelsLeftRail } from "@/components/ReelsLeftRail";
import { ARAFooter } from "@/components/ARAFooter";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
/** 히어로 등 브랜드 워드마크용 — 동글동글 레터링 */
const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-fredoka",
});
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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getSiteLocale();
  const suffix = translate(locale, "meta.brandSuffix");
  const titleDefault = translate(locale, "meta.rootTitle");
  const desc = translate(locale, "meta.rootDescription");
  const base = getSiteMetadataBase();
  return {
    metadataBase: base,
    title: {
      default: titleDefault,
      template: `%s${suffix}`,
    },
    description: desc,
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    ...socialMetadataFields(locale, titleDefault, desc),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const locale = await getSiteLocale();
  const htmlLang = locale === "en" ? "en" : "ko";

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
        var cookieMatch = document.cookie.match(/(?:^|;\s)reels-locale=([^;]+)/);
        var cookieLoc = cookieMatch ? decodeURIComponent(cookieMatch[1].trim()) : null;
        var storedLoc = localStorage.getItem("reels-locale");
        var loc =
          storedLoc === "en" || storedLoc === "ko"
            ? storedLoc
            : cookieLoc === "en" || cookieLoc === "ko"
              ? cookieLoc
              : "ko";
        document.documentElement.lang = loc === "en" ? "en" : "ko";
        try {
          if (storedLoc !== loc) localStorage.setItem("reels-locale", loc);
          if (cookieLoc !== loc) {
            var secure =
              typeof window !== "undefined" &&
              window.location &&
              window.location.protocol === "https:";
            document.cookie =
              "reels-locale=" +
              encodeURIComponent(loc) +
              ";path=/;max-age=31536000;samesite=lax" +
              (secure ? ";secure" : "");
          }
        } catch (e3) {}
      } catch (e2) {
        document.documentElement.lang = "ko";
      }
    })();
  `;

  return (
    <html
      lang={htmlLang}
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${fredoka.variable} ${montserrat.variable} ${blackHanSans.variable} ${nanumGothic.variable} ${songMyung.variable}`}
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
        <AppProviders>
          <RailHomeLogoSvgFilters />
          <NavigationRecovery />
          <GlobalLenis />
          <ReelsLeftRail />
          <div className="min-w-0 md:pl-[var(--reels-rail-w)]">
            <MallTopNav />
            {children}
            <ARAFooter />
            <DnaBuilderDock />
            <FloatingHelp />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
