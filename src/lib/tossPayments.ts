import { Prisma } from "@prisma/client";
import { getTossSecretKey } from "@/lib/tossConfig";

export type TossConfirmResponse = {
  paymentKey: string;
  orderId: string;
  orderName?: string;
  status: string;
  totalAmount: number;
  balanceAmount?: number;
  suppliedAmount?: number;
  vat?: number;
  currency: string;
  method?: string;
  requestedAt?: string;
  approvedAt?: string;
  cancels?: unknown[];
  [key: string]: unknown;
};

export type TossCancelResponse = TossConfirmResponse;

function tossAuthHeader(): string {
  const token = Buffer.from(`${getTossSecretKey()}:`).toString("base64");
  return `Basic ${token}`;
}

export async function confirmTossPayment(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<TossConfirmResponse> {
  const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: tossAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const payload = (await response.json().catch(() => null)) as TossConfirmResponse & {
    code?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(
      `[Toss confirm failed] ${payload?.code ?? response.status}: ${
        payload?.message ?? response.statusText
      }`,
    );
  }

  return payload;
}

export async function cancelTossPayment(params: {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number;
}): Promise<TossCancelResponse> {
  const response = await fetch(
    `https://api.tosspayments.com/v1/payments/${encodeURIComponent(params.paymentKey)}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: tossAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cancelReason: params.cancelReason,
        ...(params.cancelAmount ? { cancelAmount: params.cancelAmount } : {}),
      }),
    },
  );

  const payload = (await response.json().catch(() => null)) as TossCancelResponse & {
    code?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(
      `[Toss cancel failed] ${payload?.code ?? response.status}: ${
        payload?.message ?? response.statusText
      }`,
    );
  }

  return payload;
}

export function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
