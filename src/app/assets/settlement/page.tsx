import { Suspense } from "react";
import { AssetsSettlementClient } from "@/components/assets/AssetsSettlementClient";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.assetsSettlement",
    descriptionKey: "meta.assetsSettlementDescription",
  });
}

export default function AssetsSettlementPage() {
  return (
    <Suspense fallback={null}>
      <AssetsSettlementClient />
    </Suspense>
  );
}
