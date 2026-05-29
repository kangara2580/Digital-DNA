import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { translate } from "@/lib/i18n/dictionaries";
import { getSiteLocale } from "@/lib/i18n/serverLocale";
import { SellerReviewsManageClient } from "@/components/SellerReviewsManageClient";
import { DocumentTitleI18n } from "@/components/DocumentTitleI18n";
import { SELLER_SUBPAGE_MAIN_CLASS } from "@/lib/topNavIconRing";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.sellerReviews",
    descriptionKey: "meta.sellerReviewsDescription",
  });
}

export default async function SellerReviewsPage() {
  const locale = await getSiteLocale();

  return (
    <main className={SELLER_SUBPAGE_MAIN_CLASS}>
      <DocumentTitleI18n titleKey="meta.sellerReviews" />
      <header className="mb-6 max-md:pr-[calc(env(safe-area-inset-right,0px)+10.5rem)] md:mb-8 md:pr-[11.5rem] lg:pr-[12rem]">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {translate(locale, "seller.reviews.pageTitle")}
        </h1>
      </header>
      <Suspense fallback={<p className="text-zinc-500">{translate(locale, "common.loading")}</p>}>
        <SellerReviewsManageClient />
      </Suspense>
    </main>
  );
}
