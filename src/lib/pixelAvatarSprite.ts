/**
 * 프로필용 4×4 도트 스프라이트 (참고 시트 에셋).
 * `/public/avatars/pixel-sheet-*.png`
 */

export type PixelAvatarPalette = "gameboy" | "mono";

const SHEETS = {
  gameboy: { src: "/avatars/pixel-sheet-gameboy.png", w: 810, h: 812 },
  mono: { src: "/avatars/pixel-sheet-mono.png", w: 1024, h: 1005 },
} as const;

export const PIXEL_SPRITE_COLS = 4;
export const PIXEL_SPRITE_ROWS = 4;
export const PIXEL_SPRITE_COUNT = PIXEL_SPRITE_COLS * PIXEL_SPRITE_ROWS;

export function paletteForSeed(seed: string): PixelAvatarPalette {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 2 === 0 ? "gameboy" : "mono";
}

export function variantIndexFromSeed(seed: string): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 33) ^ seed.charCodeAt(i);
  }
  return Math.abs(h >>> 0) % PIXEL_SPRITE_COUNT;
}

/** 캐릭터 커스터마이즈 파츠 → 0..15 범위 (이전 선택이 스프라이트에 반영되도록) */
export function variantIndexFromParts(parts: {
  hair: string;
  eyes: string;
  nose: string;
  lips: string;
  brows: string;
  body: string;
  gender: string;
  faceShape: number;
}): number {
  const s =
    `${parts.gender}:${parts.hair}:${parts.eyes}:${parts.nose}:${parts.lips}:${parts.brows}:${parts.body}:${parts.faceShape}`;
  return variantIndexFromSeed(s);
}

export function getPixelSpriteLayers(
  palette: PixelAvatarPalette,
  variant: number,
): {
  src: string;
  bgW: number;
  bgH: number;
  cellW: number;
  cellH: number;
  posX: number;
  posY: number;
} {
  const sheet = SHEETS[palette];
  const v = ((variant % PIXEL_SPRITE_COUNT) + PIXEL_SPRITE_COUNT) % PIXEL_SPRITE_COUNT;
  const col = v % PIXEL_SPRITE_COLS;
  const row = Math.floor(v / PIXEL_SPRITE_COLS);
  const cellW = sheet.w / PIXEL_SPRITE_COLS;
  const cellH = sheet.h / PIXEL_SPRITE_ROWS;
  return {
    src: sheet.src,
    bgW: sheet.w,
    bgH: sheet.h,
    cellW,
    cellH,
    posX: -col * cellW,
    posY: -row * cellH,
  };
}
