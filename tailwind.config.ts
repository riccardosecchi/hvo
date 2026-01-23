import type { Config } from "tailwindcss";

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
        /* Pure Black Background System */
        background: "#000000",
        foreground: "#FFFFFF",

        /* Surfaces */
        surface: {
          1: "#080808",
          2: "#111111",
          3: "#181818",
        },

        /* Primary Accent - Electric Blue */
        primary: {
          DEFAULT: "#0066FF",
          foreground: "#FFFFFF",
          hover: "#0055DD",
        },

        /* Secondary */
        secondary: {
          DEFAULT: "#080808",
          foreground: "#FFFFFF",
        },

        /* Accent - For hover states (shadcn/ui) */
        accent: {
          DEFAULT: "#111111",
          foreground: "#FFFFFF",
        },

        /* Popover - For dropdown menus (shadcn/ui) */
        popover: {
          DEFAULT: "#080808",
          foreground: "#FFFFFF",
        },

        /* Muted */
        muted: {
          DEFAULT: "#0A0A0A",
          foreground: "#666666",
        },

        /* Card */
        card: {
          DEFAULT: "#080808",
          foreground: "#FFFFFF",
        },

        /* Utility */
        border: "rgba(255, 255, 255, 0.08)",
        input: "#080808",
        ring: "#0066FF",
        "ring-offset": "#000000",

        /* Semantic */
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#22C55E",
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      animation: {
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(0, 102, 255, 0.3)",
          },
          "50%": {
            boxShadow: "0 0 40px rgba(0, 102, 255, 0.5)",
          },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [],
};
export default config;

