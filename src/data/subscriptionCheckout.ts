export type SubscriptionPlanKey = "starter" | "creator" | "pro";

export type SubscriptionCheckoutPlan = {
  key: SubscriptionPlanKey;
  /** 결제 확인 화면에 표시할 플랜 이름 */
  displayName: string;
  /** 월 청구 금액(USD, 정수) */
  priceUsd: number;
  /** 매 결제 시 지급되는 DNA 크레딧 */
  dnaCreditsPerMonth: number;
};

export const SUBSCRIPTION_CHECKOUT_PLANS: Record<
  SubscriptionPlanKey,
  SubscriptionCheckoutPlan
> = {
  starter: {
    key: "starter",
    displayName: "Starter 플랜",
    priceUsd: 24,
    dnaCreditsPerMonth: 100,
  },
  creator: {
    key: "creator",
    displayName: "Creator 플랜",
    priceUsd: 49,
    dnaCreditsPerMonth: 300,
  },
  pro: {
    key: "pro",
    displayName: "Pro / Business 플랜",
    priceUsd: 149,
    dnaCreditsPerMonth: 1000,
  },
};

export function parsePlanKey(input: string | null): SubscriptionPlanKey | null {
  if (input === "starter" || input === "creator" || input === "pro") return input;
  return null;
}
