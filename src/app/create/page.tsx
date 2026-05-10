import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { CreateStudioPage } from "@/components/CreateStudioPage";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.create",
    descriptionKey: "meta.createDescription",
  });
}

function CreateFallback() {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 px-4 py-20 text-center text-[14px] text-zinc-500 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:shadow-sm">
      스튜디오 불러오는 중…
    </div>
  );
}

export default function CreatePage() {
  return (
    <main className="min-h-[60vh] bg-zinc-950 text-zinc-100 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900">
      <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 sm:py-12 lg:px-10 reels-pr-safe-fixed">
        <Suspense fallback={<CreateFallback />}>
          <CreateStudioPage />
        </Suspense>
      </div>
    </main>
  );
}
