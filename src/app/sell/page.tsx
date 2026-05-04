import { SellPageClient } from "./SellPageClient";

export const metadata = {
  title: "동영상 판매 등록 — ARA",
  description:
    "동영상 파일을 업로드하고 제목·설명·가격·AI 여부 등을 등록합니다.",
};

export default function SellPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900">
      <SellPageClient />
    </div>
  );
}
