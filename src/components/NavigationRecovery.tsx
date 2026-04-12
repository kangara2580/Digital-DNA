"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * bfcache(뒤로 가기) 복귀 시 일부 브라우저에서 캔버스/비디오 상태가 꼬여 빈 화면이 되는 경우가 있어 새로고침에 가깝게 복구합니다.
 */
export function NavigationRecovery() {
  const router = useRouter();

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        router.refresh();
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [router]);

  return null;
}
