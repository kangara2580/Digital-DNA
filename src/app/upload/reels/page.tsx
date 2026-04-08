import Link from "next/link";
import { ReelsLinkUploader } from "@/components/ReelsLinkUploader";

export const metadata = {
  title: "릴스 링크 등록 — REELS MARKET",
  description: "TikTok·Instagram 릴스 URL을 등록하고 미리보기합니다.",
};

export default function UploadReelsLinkPage() {
  return (
    <div className="min-h-screen bg-reels-abyss bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,0,85,0.1),transparent_50%)]">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <nav className="mb-6 font-mono text-[11px] text-zinc-500">
          <Link href="/" className="text-reels-cyan/90 hover:text-reels-cyan">
            홈
          </Link>
          <span className="mx-1.5 text-zinc-700">/</span>
          <span className="text-zinc-400">릴스 링크 등록</span>
        </nav>
        <ReelsLinkUploader />
      </main>
    </div>
  );
}
