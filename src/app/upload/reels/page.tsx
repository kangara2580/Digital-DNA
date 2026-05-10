import Link from "next/link";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { ReelsLinkUploader } from "@/components/ReelsLinkUploader";
import { getSiteLocale } from "@/lib/i18n/serverLocale";
import { translate } from "@/lib/i18n/dictionaries";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.uploadReels",
    descriptionKey: "meta.uploadReelsDescription",
  });
}

export default async function UploadReelsLinkPage() {
  const locale = await getSiteLocale();
  const homeLabel = translate(locale, "nav.breadcrumb.home");
  const pageLabel = translate(locale, "nav.breadcrumb.uploadReels");

  return (
    <div className="min-h-screen text-[var(--foreground)] [html[data-theme='light']_&]:bg-white [html[data-theme='dark']_&]:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(228,41,128,0.12),#02040a)]">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <nav className="mb-6 font-mono text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <Link href="/" className="text-reels-cyan/90 hover:text-reels-cyan">
            {homeLabel}
          </Link>
          <span className="mx-1.5 text-zinc-700 [html[data-theme='light']_&]:text-zinc-500">/</span>
          <span className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">{pageLabel}</span>
        </nav>
        <ReelsLinkUploader />
      </main>
    </div>
  );
}
