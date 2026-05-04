import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";

export async function generateMetadata() {
  return buildPageMetadata({ titleKey: "meta.faq" });
}

export default function FaqPage() {
  return (
    <FooterLegalPageShell
      title="FAQ"
      description="구매·환불·라이선스·업로드 등 자주 묻는 질문을 정리합니다."
    />
  );
}
