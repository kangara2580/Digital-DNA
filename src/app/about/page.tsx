import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { AboutPageBody } from "@/components/AboutPageBody";

export const metadata = {
  title: "About — ARA",
  description:
    "Turn video value into assets — a short-form video marketplace connecting creators and buyers.",
};

export default function AboutPage() {
  return (
    <FooterLegalPageShell
      title="소개"
      withCard={false}
      mainMaxClass="max-w-6xl"
      contentTopClass="-mt-10 sm:-mt-14"
      showBreadcrumb={false}
      showTitle={false}
    >
      <AboutPageBody />
    </FooterLegalPageShell>
  );
}
