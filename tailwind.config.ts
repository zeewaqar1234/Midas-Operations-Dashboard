import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Tint scale — clean light theme ──────────────────────
        // tint-1  → pure white      (page background)
        // tint-3  → very light gray (card surfaces)
        // tint-6  → light gray      (borders, dividers)
        // tint-9  → mid gray        (muted text)
        // tint-12 → near black      (primary text)
        background:  "#FFFFFF",          // tint-1
        surface:     "#F7F7F8",          // tint-3 — card bg
        "surface-2": "#EFEFEF",          // slightly darker surface
        "surface-3": "#E5E5E7",          // tint-6 — skeleton, hover bg
        border:      "#E5E5E7",          // tint-6

        // ── Brand blues (Midas brand palette) ───────────────────
        accent:        "#2782C4",        // --seg-A-color  (primary action)
        "accent-hover":"#1A6AAD",        // slightly darker on hover
        "brand-b":     "#43B7F2",        // --seg-B-color  (lighter blue)
        "brand-c":     "#8BE2FF",        // --seg-C-color  (lightest tint)

        // ── Semantic ─────────────────────────────────────────────
        success: "#10B981",
        warning: "#F59E0B",
        danger:  "#EF4444",
        mint:    "#10B981",
        burn:    "#EF4444",

        // ── Text ─────────────────────────────────────────────────
        "text-primary":   "#1D1D1D",     // tint-12
        "text-secondary": "#636366",     // mid-dark
        "text-muted":     "#838589",     // tint-9
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },

      fontWeight: {
        normal:    "400",
        medium:    "500",
        semibold:  "600",
        bold:      "700",
        extrabold: "800",
        black:     "900",
      },

      borderRadius: {
        card:  "12px",
        input: "8px",
      },

      backgroundImage: {
        "gradient-page":
          "radial-gradient(ellipse at 20% 0%, #EEF4FB 0%, #FFFFFF 60%)",
        "gradient-surface":
          "linear-gradient(135deg, #F7F7F8 0%, #FFFFFF 100%)",
      },

      boxShadow: {
        card:
          "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(229,229,231,0.9)",
        "card-hover":
          "0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(39,130,196,0.25)",
        input:
          "0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(229,229,231,0.9)",
      },

      animation: {
        pulse:     "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.25s ease-out",
      },

      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0", transform: "translateY(3px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },

      letterSpacing: {
        heading: "-0.025em",
      },
    },
  },
  plugins: [],
};

export default config;
