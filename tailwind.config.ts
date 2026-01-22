import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0F",
        foreground: "#FFFFFF",
        primary: {
          DEFAULT: "#00E5FF",
          foreground: "#0A0A0F",
        },
        secondary: {
          DEFAULT: "#E91E8C",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#1A1A2E",
          foreground: "#71717A",
        },
        card: {
          DEFAULT: "#0F0F1A",
          foreground: "#FFFFFF",
        },
        border: "#2A2A3E",
        input: "#1A1A2E",
        ring: "#00E5FF",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "bounce-slow": "bounce 2s infinite",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(0, 229, 255, 0.3)",
          },
          "50%": {
            boxShadow: "0 0 40px rgba(0, 229, 255, 0.6)",
          },
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;
