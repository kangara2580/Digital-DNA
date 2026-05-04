import { Suspense } from "react";
import { CreateStudioPage } from "@/components/CreateStudioPage";

export const metadata = {
  title: "AI 창작 — ARA",
  description: "구매한 동영상을 Kling 3.0으로 리스킨합니다.",
};

function CreateFallback() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
      스튜디오 불러오는 중…
    </div>
  );
}

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-[1100px] py-8 pl-4 sm:pl-6 lg:pl-8 reels-pr-safe-fixed">
        <Suspense fallback={<CreateFallback />}>
          <CreateStudioPage />
        </Suspense>
      </div>
    </div>
  );
}
