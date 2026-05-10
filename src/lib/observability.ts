import * as Sentry from "@sentry/nextjs";

export type ActionDomain = "like" | "wishlist" | "cart" | "checkout" | "upload";
export type ActionResult = "ok" | "fail";

export type ActionLogPayload = {
  domain: ActionDomain;
  action: string;
  result: ActionResult;
  videoId?: string;
  userId?: string | null;
  component?: string;
  stage?: string;
  errorCode?: string;
  message?: string;
  extra?: Record<string, unknown>;
};

function toTags(payload: ActionLogPayload) {
  return {
    domain: payload.domain,
    action: payload.action,
    result: payload.result,
    component: payload.component ?? "unknown",
    stage: payload.stage ?? "unknown",
    error_code: payload.errorCode ?? "unknown",
  };
}

export function logActionEvent(payload: ActionLogPayload) {
  const base = {
    ...payload,
    ts: new Date().toISOString(),
  };
  if (payload.result === "ok") {
    console.info("[obs.action.ok]", base);
  } else {
    console.warn("[obs.action.fail]", base);
  }
}

export function captureActionError(error: unknown, payload: ActionLogPayload) {
  logActionEvent(payload);
  Sentry.withScope((scope) => {
    const tags = toTags(payload);
    Object.entries(tags).forEach(([k, v]) => scope.setTag(k, v));
    scope.setLevel("error");
    scope.setContext("action", {
      videoId: payload.videoId ?? null,
      userId: payload.userId ?? null,
      message: payload.message ?? null,
      ...(payload.extra ?? {}),
    });
    if (error instanceof Error) {
      scope.setFingerprint([
        "action",
        payload.domain,
        payload.action,
        payload.errorCode ?? error.name,
      ]);
      Sentry.captureException(error);
      return;
    }
    Sentry.captureMessage(
      `${payload.domain}.${payload.action} failed: ${payload.message ?? "unknown_error"}`,
      "error",
    );
  });
}

