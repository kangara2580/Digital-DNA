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
        /** REELS MARKET — Brand magenta-pink (#E42980) + Cyan */
        reels: {
          abyss: "#050505",
          void: "#0a0a0a",
          lift: "#121212",
          muted: "#a1a1aa",
          crimson: "#E42980",
          cyan: "#00F2EA",
        },
        market: {
          canvas: "#faf7f8",
          surface: "#ffffff",
          mist: "#fff5f9",
          bloom: "#E42980",
          bloomHover: "#C41F6E",
          line: "#F9C6D4",
          lineSoft: "#FCEFF3",
        },
      },
      boxShadow: {
        "reels-crimson": "0 0 26px -4px rgba(228, 41, 128, 0.48)",
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
