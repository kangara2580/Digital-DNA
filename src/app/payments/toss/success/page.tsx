import { Suspense } from "react";
import { TossConfirmClient } from "@/components/payments/TossConfirmClient";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function TossSuccessPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05050a] px-5 text-white">
      <Suspense fallback={null}>
        <TossConfirmClient
          paymentKey={one(params.paymentKey)}
          orderId={one(params.orderId)}
          amount={one(params.amount)}
          nextRedirect={one(params.next)}
        />
      </Suspense>
    </main>
  );
}
