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
    <html lang="ko" className={`${inter.variable} ${kr.variable} scroll-smooth`}>
      <body className="min-h-screen bg-[#FFFFFF] font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
