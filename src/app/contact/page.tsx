import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";

export const metadata = {
  title: "1:1 문의 — REELS MARKET",
  description: "광고·제휴·입점 문의",
};

export default function ContactPage() {
  return (
    <FooterLegalPageShell
      title="1:1 문의"
      description="광고 노출·제휴·입점·정산 관련 문의는 아래 채널을 이용해 주세요. (양식·이메일 연동은 추후 연결 예정)"
    >
      <ul className="list-inside list-disc space-y-2 text-[14px] text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
        <li>광고·유료 상단 노출</li>
        <li>브랜드·제휴·B2B</li>
        <li>판매자·크리에이터 지원</li>
      </ul>
    </FooterLegalPageShell>
  );
}
