import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    /** 테마 문자열 안 Tailwind 클래스(예: authModalTheme) 포함 */
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    /** `spacing` / `fontSize` / `borderRadius` 기본값은 rem — `globals.css`의 fluid `html { font-size }`와 함께 뷰포트에 비례합니다. */
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "var(--font-pretendard)",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        surface: {
          DEFAULT: "#ffffff",
          raised: "#f8fafc",
          border: "#e2e8f0",
        },
        /** REELS MARKET — Brand pink (#FF2D8D) */
        reels: {
          abyss: "#050505",
          void: "#0a0a0a",
          lift: "#121212",
          muted: "#a1a1aa",
          crimson: "#FF2D8D",
          /** 레거시 이름 유지 — 브랜드 핑크 */
          cyan: "#FF2D8D",
        },
        market: {
          canvas: "#faf7f8",
          surface: "#ffffff",
          mist: "#fff5f9",
          bloom: "#FF2D8D",
          bloomHover: "#E6287F",
          line: "#F9C6D4",
          lineSoft: "#FCEFF3",
        },
      },
      boxShadow: {
        "reels-crimson": "0 0 26px -4px rgba(255, 45, 141, 0.48)",
        "reels-cyan": "0 0 28px -6px rgba(255, 45, 141, 0.42)",
      },
      transitionDuration: {
        page: "400ms",
      },
    },
  },
  plugins: [],
};

export default config;
