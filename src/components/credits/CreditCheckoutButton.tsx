"use client";

import { TossCheckoutButton } from "@/components/payments/TossCheckoutButton";

export function CreditCheckoutButton({
  productKey,
  disabled,
}: {
  productKey: string;
  disabled?: boolean;
}) {
  return (
    <TossCheckoutButton
      productType="credits"
      productKey={productKey}
      disabled={disabled}
    >
      토스페이먼츠로 결제하기
    </TossCheckoutButton>
  );
}
