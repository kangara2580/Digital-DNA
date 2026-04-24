import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";

export const metadata = {
  title: "FAQ — ARA",
};

export default function FaqPage() {
  return (
    <FooterLegalPageShell
      title="FAQ"
      description="구매·환불·라이선스·업로드 등 자주 묻는 질문을 정리합니다."
    />
  );
}
