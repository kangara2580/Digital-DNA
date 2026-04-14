/**
 * DiceBear 9.x Notionists — 베스트 구매평과 동일한 일러스트 스타일.
 * @see https://www.dicebear.com/styles/notionists/
 */

export type CharacterGender = "feminine" | "masculine";

/** 얼굴형: 스케일만 살짝 바꿔 윤곽 느낌을 다르게 (동일 베이스 일러스트) */
export type CharacterFaceShape = 0 | 1 | 2;

export type CharacterPartsV1 = {
  v: 1;
  seed: string;
  gender: CharacterGender;
  hair: string;
  eyes: string;
  nose: string;
  lips: string;
  brows: string;
  body: string;
  faceShape: CharacterFaceShape;
};

export const NOTIONISTS_HAIR = [
  "variant08",
  "variant15",
  "variant22",
  "variant30",
  "variant38",
  "variant48",
  "variant58",
  "hat",
] as const;

export const NOTIONISTS_EYES = [
  "variant01",
  "variant02",
  "variant03",
  "variant04",
  "variant05",
] as const;

export const NOTIONISTS_NOSE = [
  "variant04",
  "variant08",
  "variant12",
  "variant16",
  "variant20",
] as const;

export const NOTIONISTS_LIPS = [
  "variant06",
  "variant12",
  "variant18",
  "variant24",
  "variant30",
] as const;

export const NOTIONISTS_BROWS = [
  "variant03",
  "variant06",
  "variant09",
  "variant11",
  "variant13",
] as const;

export const NOTIONISTS_BODY = [
  "variant06",
  "variant10",
  "variant14",
  "variant18",
  "variant22",
  "variant25",
  "variant20",
  "variant16",
] as const;

const FACE_SHAPE_SCALE: Record<CharacterFaceShape, number> = {
  0: 96,
  1: 100,
  2: 108,
};

function beardProbabilityForGender(g: CharacterGender): number {
  if (g === "feminine") return 0;
  return 22;
}

export function createDefaultCharacterParts(seed: string): CharacterPartsV1 {
  return {
    v: 1,
    seed: seed.trim() || "reels-market",
    gender: "feminine",
    hair: NOTIONISTS_HAIR[3],
    eyes: NOTIONISTS_EYES[2],
    nose: NOTIONISTS_NOSE[2],
    lips: NOTIONISTS_LIPS[2],
    brows: NOTIONISTS_BROWS[2],
    body: NOTIONISTS_BODY[3],
    faceShape: 1,
  };
}

function isAllowed(value: string, allowed: readonly string[]): boolean {
  return (allowed as readonly string[]).includes(value);
}

export function normalizeCharacterParts(
  raw: unknown,
  fallbackSeed: string,
): CharacterPartsV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<CharacterPartsV1>;
  if (o.v !== 1) return null;
  const seed = typeof o.seed === "string" && o.seed.trim() ? o.seed.trim() : fallbackSeed;
  const base = createDefaultCharacterParts(seed);
  const g =
    typeof (o as { gender?: unknown }).gender === "string"
      ? String((o as { gender?: string }).gender)
      : "";
  /** 예전 "neutral" 저장분은 여성 쪽으로 맞춤 */
  const gender: CharacterGender = g === "masculine" ? "masculine" : "feminine";
  const faceShape: CharacterFaceShape =
    o.faceShape === 0 || o.faceShape === 1 || o.faceShape === 2 ? o.faceShape : 1;
  return {
    v: 1,
    seed,
    gender,
    hair: isAllowed(o.hair ?? "", NOTIONISTS_HAIR) ? o.hair! : base.hair,
    eyes: isAllowed(o.eyes ?? "", NOTIONISTS_EYES) ? o.eyes! : base.eyes,
    nose: isAllowed(o.nose ?? "", NOTIONISTS_NOSE) ? o.nose! : base.nose,
    lips: isAllowed(o.lips ?? "", NOTIONISTS_LIPS) ? o.lips! : base.lips,
    brows: isAllowed(o.brows ?? "", NOTIONISTS_BROWS) ? o.brows! : base.brows,
    body: isAllowed(o.body ?? "", NOTIONISTS_BODY) ? o.body! : base.body,
    faceShape,
  };
}

/**
 * 단일 파츠만 허용해 시드에 따라 항상 같은 조합이 나오도록 고정합니다.
 * gesture/안경/수염 확률은 UI 노이즈를 줄이기 위해 낮춥니다.
 */
export function buildNotionistsCustomAvatarUrl(parts: CharacterPartsV1): string {
  const scale = FACE_SHAPE_SCALE[parts.faceShape];
  const bp = beardProbabilityForGender(parts.gender);
  const q = new URLSearchParams();
  q.set("seed", parts.seed);
  q.set("hair", parts.hair);
  q.set("eyes", parts.eyes);
  q.set("nose", parts.nose);
  q.set("lips", parts.lips);
  q.set("brows", parts.brows);
  q.set("body", parts.body);
  q.set("scale", String(scale));
  q.set("beardProbability", String(bp));
  q.set("gestureProbability", "0");
  q.set("glassesProbability", "0");
  q.set("bodyIconProbability", "0");
  q.set("backgroundType", "gradientLinear");
  return `https://api.dicebear.com/9.x/notionists/svg?${q.toString()}`;
}

export function randomCharacterSeed(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `reels-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}
