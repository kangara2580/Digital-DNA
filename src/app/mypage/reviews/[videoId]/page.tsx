import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { translate } from "@/lib/i18n/dictionaries";
import { getSiteLocale } from "@/lib/i18n/serverLocale";
import { ReviewWritePageClient } from "@/components/ReviewWritePageClient";
import { DocumentTitleI18n } from "@/components/DocumentTitleI18n";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.reviewWrite",
    descriptionKey: "meta.reviewWriteDescription",
  });
}

export default async function ReviewWritePage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;
  const locale = await getSiteLocale();

  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-[50vh] max-w-lg px-4 py-12 text-zinc-100">
          {translate(locale, "common.loading")}
        </main>
      }
    >
      <DocumentTitleI18n titleKey="meta.reviewWrite" />
      <ReviewWritePageClient videoId={videoId} />
    </Suspense>
  );
}
