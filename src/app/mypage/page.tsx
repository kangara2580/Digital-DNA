import { Suspense } from "react";
import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { MyPageDashboard } from "@/components/MyPageDashboard";

export async function generateMetadata() {
  return buildPageMetadata({ titleKey: "meta.mypage" });
}

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = sp.tab;
  const tab = Array.isArray(raw) ? raw[0] : raw;
  if (
    tab === "basic" ||
    tab === "profile" ||
    tab === "edit" ||
    tab === "language"
  ) {
    redirect(`/settings?tab=${encodeURIComponent(tab)}`);
  }

  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-[50vh] max-w-3xl px-4 py-12 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
          불러오는 중…
        </main>
      }
    >
      <MyPageDashboard />
    </Suspense>
  );
}
