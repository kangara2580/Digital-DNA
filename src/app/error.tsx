"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col gap-4 px-4 py-16 text-center text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
      <h1 className="text-xl font-extrabold">화면을 불러오지 못했습니다</h1>
      <p className="text-[14px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
        {error.message || "알 수 없는 오류가 발생했습니다."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mx-auto rounded-full bg-reels-crimson px-6 py-2.5 text-[14px] font-bold text-white"
      >
        다시 시도
      </button>
    </div>
  );
}
