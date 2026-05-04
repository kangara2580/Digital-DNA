/**
 * ARA 프로필 도트 — 참고 레트로 감성만 살린 **오리지널** 프로시저럴 타원 얼굴
 * (외부 스프라이트 시트 없음 · seed + variant로 결정)
 */

export type PixelAvatarPalette = "mochi" | "stardust";

export const PIXEL_VARIANT_COUNT = 16;

/** 해시 기반: 부드러운 핑크 베이스 vs 살짝 시원한 라벤더-블루 베이스 */
export function paletteForSeed(seed: string): PixelAvatarPalette {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 2 === 0 ? "mochi" : "stardust";
}

export function variantIndexFromSeed(seed: string): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 33) ^ seed.charCodeAt(i);
  }
  return Math.abs(h >>> 0) % PIXEL_VARIANT_COUNT;
}

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
  const s = `${parts.gender}:${parts.hair}:${parts.eyes}:${parts.nose}:${parts.lips}:${parts.brows}:${parts.body}:${parts.faceShape}`;
  return variantIndexFromSeed(s);
}

function mulberry32(a: number): () => number {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCombined(entropy: string, variant: number): number {
  let h = variant * 0x9e3779b9;
  for (let i = 0; i < entropy.length; i++) {
    h = Math.imul(h ^ entropy.charCodeAt(i), 0x1000193);
  }
  return h >>> 0;
}

const GRID = 16;
const SCALE = 4;
const VB = GRID * SCALE;

type Theme = "light" | "dark";

export type PixelAvatarTheme = Theme;

const PALETTES = {
  mochi: {
    light: {
      bg: "#f3e8f0",
      skin: "#ffc8b4",
      skinShadow: "#e8a090",
      blush: "#ff8fb0",
      outline: "#4a3f55",
      eye: "#302838",
      mouth: "#6b4a58",
      hair: ["#7a6188", "#5c6d86", "#8b6044", "#4d6675", "#885c68", "#6a5a48"],
    },
    dark: {
      bg: "#241c2a",
      skin: "#e8a898",
      skinShadow: "#c47868",
      blush: "#d8708e",
      outline: "#d8cfe4",
      eye: "#1a1424",
      mouth: "#5a3848",
      hair: ["#9a80a8", "#7088a0", "#b08060", "#608088", "#a87088", "#887860"],
    },
  },
  stardust: {
    light: {
      bg: "#e8ecf7",
      skin: "#ffd0c4",
      skinShadow: "#e8a898",
      blush: "#ff8cab",
      outline: "#3d4558",
      eye: "#222c40",
      mouth: "#554858",
      hair: ["#4d5c78", "#584a78", "#3d6870", "#705878", "#48485f", "#5a5a78"],
    },
    dark: {
      bg: "#1a1f2e",
      skin: "#dcb0a4",
      skinShadow: "#a87868",
      blush: "#c06080",
      outline: "#c8c4dd",
      eye: "#121820",
      mouth: "#483040",
      hair: ["#7888a8", "#9080b0", "#508890", "#9080a0", "#7878a0", "#6880a0"],
    },
  },
} as const;

function setCell(m: Map<string, string>, x: number, y: number, c: string, overwrite = true): void {
  if (x < 0 || x >= GRID || y < 0 || y >= GRID) return;
  const k = `${x},${y}`;
  if (!overwrite && m.has(k)) return;
  m.set(k, c);
}

function fillSoftFace(
  m: Map<string, string>,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  skin: string,
  shadow: string,
): void {
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny <= 1) {
        const shade = ny > 0.35 ? shadow : skin;
        setCell(m, x, y, shade);
      }
    }
  }
}

function fillHairBlob(
  m: Map<string, string>,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  hair: string,
): void {
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny <= 1) setCell(m, x, y, hair);
    }
  }
}

function outlineExterior(m: Map<string, string>, outline: string): void {
  const next = new Map(m);
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (m.has(`${x},${y}`)) continue;
      let touches = false;
      for (const [dx, dy] of [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ]) {
        if (m.has(`${x + dx},${y + dy}`)) {
          touches = true;
          break;
        }
      }
      if (touches) setCell(next, x, y, outline, true);
    }
  }
  next.forEach((v, k) => m.set(k, v));
}

/**
 * 16×16 논리 그리드를 4× 배율 SVG로 렌더 (nearest-neighbor 스케일은 호스트 CSS)
 */
export function buildAraCutePixelSvg(
  entropy: string,
  variant: number,
  palette: PixelAvatarPalette,
  theme: PixelAvatarTheme,
): string {
  const rand = mulberry32(hashCombined(entropy, variant));
  const v = ((variant % PIXEL_VARIANT_COUNT) + PIXEL_VARIANT_COUNT) % PIXEL_VARIANT_COUNT;
  const colors = PALETTES[palette][theme];

  const hairCol = colors.hair[Math.floor(rand() * colors.hair.length)]!;
  const cut = (["round", "pixie", "floof"] as const)[v % 3]!;
  const faceRx = 3.1 + (v >> 1) * 0.08 + rand() * 0.15;
  const faceRy = 3.6 + (v % 3) * 0.1;
  let hairRx = faceRx + 0.85 + rand() * 0.35;
  let hairRy = 2.9 + (v >> 2) * 0.12;
  let hairCy = 6.2;
  if (cut === "pixie") {
    hairRy *= 0.88;
    hairCy += 0.35;
    hairRx *= 0.92;
  } else if (cut === "floof") {
    hairRx *= 1.1;
    hairRy *= 1.12;
    hairCy -= 0.15;
  }
  const cx = 7.5 + (rand() - 0.5) * 0.35;
  const faceCy = 10.1 + (v % 4) * 0.06;

  const m = new Map<string, string>();
  fillHairBlob(m, cx, hairCy, hairRx, hairRy, hairCol);
  fillSoftFace(m, cx, faceCy, faceRx, faceRy, colors.skin, colors.skinShadow);
  if (v % 2 === 0) {
    const bangY = Math.floor(faceCy - faceRy * 0.55);
    for (let dx = -2; dx <= 2; dx++) {
      setCell(m, Math.floor(cx) + dx, bangY, hairCol, true);
    }
  }
  outlineExterior(m, colors.outline);

  const eyeY = Math.floor(9.2 + (v % 3) * 0.35 + (rand() - 0.5));
  const spread = 1 + (v % 2);
  const lx = Math.floor(cx - spread - (v % 2));
  const rx = Math.ceil(cx + spread);
  setCell(m, lx, eyeY, colors.eye, true);
  setCell(m, rx, eyeY, colors.eye, true);
  /** 하이라이트 점 — 귀여움 */
  if (rand() > 0.25) {
    setCell(m, lx + 1, eyeY - 1, theme === "light" ? "#ffffff" : "#c8c0d8", true);
  }

  const mouthRow = Math.min(GRID - 2, eyeY + 2 + (v % 2));
  const smile = v % 3;
  if (smile === 0) {
    setCell(m, Math.floor(cx) - 1, mouthRow, colors.mouth, true);
    setCell(m, Math.floor(cx), mouthRow, colors.mouth, true);
  } else if (smile === 1) {
    setCell(m, Math.floor(cx) - 1, mouthRow, colors.mouth, true);
    setCell(m, Math.floor(cx), mouthRow + 1, colors.mouth, true);
    setCell(m, Math.floor(cx) + 1, mouthRow, colors.mouth, true);
  } else {
    setCell(m, Math.floor(cx), mouthRow, colors.mouth, true);
  }

  if (rand() > 0.2) {
    setCell(m, lx - 1, eyeY + 1, colors.blush, true);
    setCell(m, rx + 1, eyeY + 1, colors.blush, true);
  }

  const rects: string[] = [];
  m.forEach((fill, key) => {
    const [sx, sy] = key.split(",").map(Number) as [number, number];
    rects.push(
      `<rect x="${sx * SCALE}" y="${sy * SCALE}" width="${SCALE}" height="${SCALE}" fill="${fill}" shape-rendering="crispEdges"/>`,
    );
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB} ${VB}" width="${VB}" height="${VB}" role="img">` +
    `<rect width="100%" height="100%" fill="${colors.bg}" shape-rendering="crispEdges"/>` +
    rects.join("") +
    `</svg>`;
}

export function araCutePixelSvgDataUrl(
  entropy: string,
  variant: number,
  palette: PixelAvatarPalette,
  theme: PixelAvatarTheme,
): string {
  const svg = buildAraCutePixelSvg(entropy, variant, palette, theme);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** 설정에서 고를 수 있는 고정 도트 캐릭터 (저장 값은 `storageSeed`) */
export type AraDotProfilePreset = {
  storageSeed: string;
  label: string;
  entropy: string;
  variant: number;
  palette: PixelAvatarPalette;
};

/** 프로필에서 고를 기본 도트 수 (스프라이트 variant 폭과 무관하게 고정 열거) */
const ARA_DOT_PRESET_SLOTS = 8;

function buildAraDotPresetList(): readonly AraDotProfilePreset[] {
  const out: AraDotProfilePreset[] = [];
  for (let i = 0; i < ARA_DOT_PRESET_SLOTS; i++) {
    const palette: PixelAvatarPalette = i % 2 === 0 ? "mochi" : "stardust";
    const variant = (i * 2 + 3) % PIXEL_VARIANT_COUNT;
    out.push({
      storageSeed: `ara-dot-${String(i).padStart(2, "0")}`,
      label: `기본 도트 ${i + 1}`,
      entropy: `ara-cute-preset-${i}-v${variant}-${palette}`,
      variant,
      palette,
    });
  }
  return out;
}

export const ARA_DOT_PROFILE_PRESETS = buildAraDotPresetList();

export const DEFAULT_ARA_DOT_PRESET_SEED = ARA_DOT_PROFILE_PRESETS[0]!.storageSeed;

export function getAraDotPresetByStorageSeed(seed: string): AraDotProfilePreset | undefined {
  return ARA_DOT_PROFILE_PRESETS.find((p) => p.storageSeed === seed);
}
