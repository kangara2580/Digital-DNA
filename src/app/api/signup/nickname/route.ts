import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeNickname(input: string): string {
  return input.trim().toLowerCase();
}

type Payload = {
  nickname?: string;
  intent?: "check" | "reserve" | "release";
  email?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;
    const rawNickname = body.nickname?.trim() ?? "";
    const intent = body.intent ?? "check";
    const email = body.email?.trim().toLowerCase() || null;

    if (!rawNickname) {
      return NextResponse.json(
        { ok: false, message: "닉네임을 입력해 주세요." },
        { status: 400 },
      );
    }

    const nickname = normalizeNickname(rawNickname);
    const existing = await prisma.nicknameReservation.findUnique({
      where: { nickname },
    });

    if (intent === "check") {
      return NextResponse.json({ ok: true, available: !existing });
    }

    if (intent === "reserve") {
      if (existing) {
        if (email && existing.reservedByEmail === email) {
          return NextResponse.json({ ok: true, available: true, reserved: true });
        }
        return NextResponse.json({ ok: true, available: false, reserved: false });
      }

      await prisma.nicknameReservation.create({
        data: {
          nickname,
          displayNickname: rawNickname,
          reservedByEmail: email,
        },
      });
      return NextResponse.json({ ok: true, available: true, reserved: true });
    }

    if (intent === "release") {
      if (!existing) {
        return NextResponse.json({ ok: true, released: true });
      }
      if (!email || (existing.reservedByEmail && existing.reservedByEmail !== email)) {
        return NextResponse.json({ ok: true, released: false });
      }
      await prisma.nicknameReservation.delete({ where: { nickname } });
      return NextResponse.json({ ok: true, released: true });
    }

    return NextResponse.json(
      { ok: false, message: "지원하지 않는 요청입니다." },
      { status: 400 },
    );
  } catch {
    return NextResponse.json(
      { ok: false, message: "닉네임 확인 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
