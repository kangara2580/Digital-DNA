import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";

export const metadata = {
  title: "공지사항 — REELS MARKET",
};

export default function NoticePage() {
  return (
    <FooterLegalPageShell
      title="공지사항"
      description="서비스 점검·정책 변경·이벤트 소식을 이곳에 게시합니다."
    />
  );
}
