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
        /** REELS MARKET — Brand magenta-pink (#fc03a5) + Cyan */
        reels: {
          abyss: "#050505",
          void: "#0a0a0a",
          lift: "#121212",
          muted: "#a1a1aa",
          crimson: "#fc03a5",
          cyan: "#00F2EA",
        },
        market: {
          canvas: "#faf7f8",
          surface: "#ffffff",
          mist: "#fff5f9",
          bloom: "#fc03a5",
          bloomHover: "#d9028f",
          line: "#fecdd3",
          lineSoft: "#ffe4e9",
        },
      },
      boxShadow: {
        "reels-crimson": "0 0 26px -4px rgba(252, 3, 165, 0.48)",
        "reels-cyan": "0 0 28px -6px rgba(0, 242, 234, 0.4)",
      },
      transitionDuration: {
        page: "400ms",
      },
    },
  },
  plugins: [],
};

export default config;
