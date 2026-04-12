import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";

export const metadata = {
  title: "개인정보처리방침 — REELS MARKET",
};

export default function PrivacyPage() {
  return (
    <FooterLegalPageShell
      title="개인정보처리방침"
      description="수집 항목·이용 목적·보관 기간·제3자 제공 및 파기 절차를 안내합니다."
    />
  );
}
