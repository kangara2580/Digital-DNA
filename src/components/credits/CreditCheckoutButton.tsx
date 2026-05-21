"use client";

import { PolarCheckoutButton } from "@/components/payments/PolarCheckoutButton";
import type { CreditPackKey } from "@/lib/polarConfig";

export function CreditCheckoutButton({
  productKey,
  disabled,
}: {
  productKey: string;
  disabled?: boolean;
}) {
  return (
    <PolarCheckoutButton
      packKey={productKey as CreditPackKey}
      disabled={disabled}
    >
      이 패키지로 충전
    </PolarCheckoutButton>
  );
}
