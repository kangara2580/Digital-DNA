import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/serverSession";
import { NotificationsPageClient } from "@/components/NotificationsPageClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "알림 — ARA",
  description: "판매자 알림 및 가격 제안을 확인하세요.",
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">알림</h1>
      <NotificationsPageClient userId={user.id} />
    </div>
  );
}
