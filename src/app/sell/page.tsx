import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { SellPageClient } from "./SellPageClient";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.sell",
    descriptionKey: "meta.sellDescription",
  });
}

export default function SellPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900">
      <SellPageClient />
    </div>
  );
}
