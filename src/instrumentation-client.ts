/**
 * Next devtools는 Promise reject 이유가 Event일 때 `new Error("[object Event]")` 오버레이를 띄웁니다.
 * 미디어/로드 경로에서 드물게 Event가 넘어오는 경우가 있어, 조기에 삼킵니다.
 * (instrumentation-client는 하이드레이션 전에 실행됨)
 */
if (typeof window !== "undefined") {
  window.addEventListener(
    "unhandledrejection",
    (e: PromiseRejectionEvent) => {
      if (e.reason instanceof Event) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (process.env.NODE_ENV === "development") {
          console.debug(
            "[Digital-DNA] suppressed Promise rejection (Event):",
            e.reason.type,
          );
        }
      }
    },
    true,
  );
}
