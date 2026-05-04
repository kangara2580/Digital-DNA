import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { SubscribeCheckoutFlow } from "@/components/subscribe/SubscribeCheckoutFlow";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.checkout",
    descriptionKey: "meta.checkoutDescription",
  });
}

function CheckoutFallback() {
  return (
    <main className="mx-auto min-h-[50vh] max-w-6xl px-4 py-12 text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
      불러오는 중…
    </main>
  );
}

export default function SubscribeCheckoutPage() {
  return (
    <div className="min-h-[calc(100dvh-var(--header-height,4.5rem))] text-[var(--foreground,#fafafa)] [html[data-theme='light']_&]:bg-white [html[data-theme='dark']_&]:bg-transparent">
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Suspense fallback={<CheckoutFallback />}>
          <SubscribeCheckoutFlow />
        </Suspense>
      </main>
    </div>
  );
}
