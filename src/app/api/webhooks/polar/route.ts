import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "polar_webhook_disabled",
      message: "Polar webhooks are disabled because ARA uses Toss Payments for the Korea MVP.",
    },
    { status: 410 },
  );
}
