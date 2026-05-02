import { Suspense } from "react";
import { AccountSettingsDashboard } from "@/components/AccountSettingsDashboard";

export const metadata = {
  title: "설정 — ARA",
};

export default function SettingsPage() {
  return (
    <Suspense
      fallback={<main className="mx-auto min-h-[50vh] max-w-3xl px-4 py-12 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">불러오는 중…</main>}
    >
      <AccountSettingsDashboard />
    </Suspense>
  );
}
