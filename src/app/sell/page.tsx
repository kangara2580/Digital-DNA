import { SellPageClient } from "./SellPageClient";

export const metadata = {
  title: "릴스 판매 등록 — ARA",
  description:
    "동영상 파일을 업로드하고 제목·설명·해시태그·가격·AI 여부 등을 등록합니다.",
};

export default function SellPage() {
  return (
    <div className="min-h-screen text-[var(--foreground)] [html[data-theme='light']_&]:bg-white [html[data-theme='dark']_&]:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(252,3,165,0.12),#02040a)]">
      <SellPageClient />
    </div>
  );
}
