import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/serverSession";
import { RefundRequestPageClient } from "@/components/RefundRequestPageClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "환불 요청 — ARA",
  description: "구매 내역을 확인하고 환불을 요청하세요.",
};

export default async function RefundsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">환불 요청</h1>
      <p className="mb-6 text-sm text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
        구매 내역을 확인하고 환불을 요청할 수 있습니다. 관리자 검토 후 처리됩니다.
      </p>
      <RefundRequestPageClient />
    </div>
  );
}
