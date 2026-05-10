import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { AccountSettingsDashboard } from "@/components/AccountSettingsDashboard";
import { translate } from "@/lib/i18n/dictionaries";
import { getSiteLocale } from "@/lib/i18n/serverLocale";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.settings",
    descriptionKey: "meta.settingsDescription",
  });
}

export default async function SettingsPage() {
  const locale = await getSiteLocale();
  const loadingText = translate(locale, "common.loading");

  return (
    <Suspense
      fallback={<main className="mx-auto min-h-[50vh] max-w-3xl px-4 py-12 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">{loadingText}</main>}
    >
      <AccountSettingsDashboard />
    </Suspense>
  );
}
