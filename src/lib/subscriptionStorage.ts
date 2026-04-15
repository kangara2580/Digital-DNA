import type { SubscriptionPlanKey } from "@/data/subscriptionCheckout";

const KEY = "reels-subscription-local";

export type StoredSubscription = {
  planKey: SubscriptionPlanKey;
  planLabel: string;
  /** ISO 문자열 — 다음 갱신 예정일 */
  nextRenewalIso: string;
  updatedAtIso: string;
};

export function readStoredSubscription(): StoredSubscription | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<StoredSubscription>;
    if (
      typeof v?.planKey !== "string" ||
      typeof v?.planLabel !== "string" ||
      typeof v?.nextRenewalIso !== "string"
    ) {
      return null;
    }
    return {
      planKey: v.planKey as SubscriptionPlanKey,
      planLabel: v.planLabel,
      nextRenewalIso: v.nextRenewalIso,
      updatedAtIso: typeof v.updatedAtIso === "string" ? v.updatedAtIso : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeStoredSubscription(next: StoredSubscription) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("reels-subscription-updated"));
}

export function clearStoredSubscription() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("reels-subscription-updated"));
}
