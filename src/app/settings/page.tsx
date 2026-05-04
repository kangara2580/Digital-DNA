import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { AccountSettingsDashboard } from "@/components/AccountSettingsDashboard";

export async function generateMetadata() {
  return buildPageMetadata({ titleKey: "meta.settings" });
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={<main className="mx-auto min-h-[50vh] max-w-3xl px-4 py-12 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">불러오는 중…</main>}
    >
      <AccountSettingsDashboard />
    </Suspense>
  );
}
