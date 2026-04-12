import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";

export const metadata = {
  title: "라이선스 규정 — REELS MARKET",
  description: "조각(클립) 판매·사용 범위에 관한 핵심 규정",
};

export default function LicensePage() {
  return (
    <FooterLegalPageShell
      title="라이선스 규정"
      description="마켓에 등록된 모션 조각의 사용 범위·재판매·크레딧 표기 등은 본 규정과 개별 거래 조건을 따릅니다."
    />
  );
}
