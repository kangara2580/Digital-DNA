import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "polar_disabled",
      message: "Polar checkout is disabled. ARA now uses Toss Payments for Korea MVP commerce.",
    },
    { status: 410 },
  );
}
