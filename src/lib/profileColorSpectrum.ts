import { BRAND_PINK_HEX } from "@/lib/brandPinkTokens";

/** 프로필 원형 배경 — 스펙트럼 시작(검정) */
export const PROFILE_COLOR_BLACK = "#000000";

/** 프로필 원형 배경 — 스펙트럼 끝(브랜드 핑크) */
export const PROFILE_COLOR_BRAND = BRAND_PINK_HEX;

const SPECTRUM_STEPS = 28;

function parseHex(hex: string): [number, number, number] | null {
  const raw = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(raw)) return null;
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function interpolateHex(from: string, to: string, t: number): string {
  const a = parseHex(from);
  const b = parseHex(to);
  if (!a || !b) return to;
  const u = Math.max(0, Math.min(1, t));
  return rgbToHex(
    a[0] + (b[0] - a[0]) * u,
    a[1] + (b[1] - a[1]) * u,
    a[2] + (b[2] - a[2]) * u,
  );
}

/** 검정 → 브랜드 핑크 연속 스펙트럼(계정 설정·폴백 공용) */
export const PROFILE_COLOR_SPECTRUM: readonly string[] = Array.from(
  { length: SPECTRUM_STEPS },
  (_, i) =>
    interpolateHex(
      PROFILE_COLOR_BLACK,
      PROFILE_COLOR_BRAND,
      SPECTRUM_STEPS <= 1 ? 0 : i / (SPECTRUM_STEPS - 1),
    ),
);

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function normalizeProfileColorHex(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;
  const raw = input.trim();
  const withHash = raw.startsWith("#") ? raw : `#${raw}`;
  const parsed = parseHex(withHash);
  if (!parsed) return null;
  return rgbToHex(...parsed).toUpperCase();
}

/** 스펙트럼 위치 0(검정) ~ 1(브랜드 핑크) */
export function profileColorAtPosition(t: number): string {
  const u = Math.max(0, Math.min(1, t));
  return interpolateHex(PROFILE_COLOR_BLACK, PROFILE_COLOR_BRAND, u);
}

/** 저장된 hex → 슬라이더 위치(0~1) */
export function positionFromProfileColor(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  let bestT = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    const sample = parseHex(profileColorAtPosition(t));
    if (!sample) continue;
    const d =
      (rgb[0] - sample[0]) ** 2 +
      (rgb[1] - sample[1]) ** 2 +
      (rgb[2] - sample[2]) ** 2;
    if (d < bestDist) {
      bestDist = d;
      bestT = t;
    }
  }
  return bestT;
}

export const PROFILE_SPECTRUM_GRADIENT = `linear-gradient(to right, ${PROFILE_COLOR_BLACK}, ${PROFILE_COLOR_BRAND})`;

export function isProfileColorHex(hex: string): boolean {
  return normalizeProfileColorHex(hex) !== null;
}

export function profileColorFromSeed(seed: string): string {
  const s = seed.trim() || "reels-market";
  const idx = hashSeed(s) % PROFILE_COLOR_SPECTRUM.length;
  return PROFILE_COLOR_SPECTRUM[idx]!;
}

export function randomProfileColor(): string {
  const idx = Math.floor(Math.random() * PROFILE_COLOR_SPECTRUM.length);
  return PROFILE_COLOR_SPECTRUM[idx]!;
}

/** 배경 대비 이니셜 글자색 */
export function profileInitialTextClass(hex: string): string {
  const rgb = parseHex(hex);
  if (!rgb) return "text-white";
  const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return luminance > 0.62 ? "text-zinc-950" : "text-white";
}

export function resolveStoredProfileColor(
  avatarKind: string | null | undefined,
  avatarSeed: string | null | undefined,
  fallbackSeed: string,
): string {
  if (avatarKind === "color") {
    const hex = normalizeProfileColorHex(avatarSeed);
    if (hex) return hex;
  }
  return profileColorFromSeed(fallbackSeed);
}
