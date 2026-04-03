import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const kr = Noto_Sans_KR({
  subsets: ["latin", "korean"],
  variable: "--font-kr",
  weight: ["300", "400", "500", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "디지털 DNA — 나만의 영상을 판매하는 곳",
  description:
    "크리에이터를 위한 동영상 쇼핑몰. 릴스를 제작하고, 판매하고, 구매하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} ${kr.variable}`}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
