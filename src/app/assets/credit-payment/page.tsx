import { Suspense } from "react";
import { AssetsCreditPaymentClient } from "@/components/assets/AssetsCreditPaymentClient";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.assetsCreditPayment",
    descriptionKey: "meta.assetsCreditPaymentDescription",
  });
}

export default function AssetsCreditPaymentPage() {
  return (
    <Suspense fallback={null}>
      <AssetsCreditPaymentClient />
    </Suspense>
  );
}
