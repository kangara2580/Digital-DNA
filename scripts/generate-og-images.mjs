#!/usr/bin/env node
/**
 * OG SVG → PNG (1200×630, 800×420 카카오 권장 비율).
 * npx @resvg/resvg-js 사용. 적용 전 미리보기용.
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ogDir = join(root, "public", "og");
const svgPath = join(ogDir, "ara-og-default.svg");
const logoPath = join(root, "public", "brand", "rail-home-logo.png");
const logoB64 = readFileSync(logoPath).toString("base64");
let svg = readFileSync(svgPath, "utf8");
svg = svg.replace(
  'xlink:href="../brand/rail-home-logo.png"',
  `xlink:href="data:image/png;base64,${logoB64}"`,
);
const fredokaWoff = join(
  root,
  "node_modules",
  "@fontsource",
  "fredoka",
  "files",
  "fredoka-latin-600-normal.woff",
);

async function renderPng(width, height, outName) {
  const { Resvg } = await import("@resvg/resvg-js");
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    background: "#FFFFFF",
    font: {
      fontFiles: [fredokaWoff],
      loadSystemFonts: true,
      defaultFontFamily: "Fredoka",
    },
  });
  const rendered = resvg.render();
  const png = rendered.asPng();
  if (height && rendered.height !== height) {
    /* width fit only — aspect preserved from 1200:630 */
  }
  const out = join(ogDir, outName);
  writeFileSync(out, png);
  console.log(`Wrote ${out} (${rendered.width}×${rendered.height})`);
}

mkdirSync(ogDir, { recursive: true });

try {
  await renderPng(1200, 630, "ara-og-default.png");
  await renderPng(800, null, "ara-og-kakao.png");
  console.log("Done.");
} catch (e) {
  console.error("Install @resvg/resvg-js in project or run: npm i -D @resvg/resvg-js");
  console.error(e);
  process.exit(1);
}
