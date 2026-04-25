import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
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
        /** REELS MARKET — Cobalt + Cyan theme */
        reels: {
          abyss: "#050505",
          void: "#0a0a0a",
          lift: "#121212",
          muted: "#a1a1aa",
          crimson: "#1E4ED8",
          cyan: "#00F2EA",
        },
        market: {
          canvas: "#faf7f8",
          surface: "#ffffff",
          mist: "#fff5f7",
          bloom: "#e11d48",
          bloomHover: "#be123c",
          line: "#fecdd3",
          lineSoft: "#ffe4e9",
        },
      },
      boxShadow: {
        "reels-crimson": "0 0 24px -4px rgba(59, 130, 246, 0.52)",
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
