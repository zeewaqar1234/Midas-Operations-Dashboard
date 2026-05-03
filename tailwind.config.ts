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
        // Midas institutional palette — deep navy, not pure black
        background: "#0B0E17",
        surface: "#111827",
        "surface-2": "#1A2035",
        "surface-3": "#232B42",
        border: "#2A3350",
        accent: "#3B82F6",
        "accent-hover": "#2563EB",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        "text-primary": "#F1F5F9",
        "text-secondary": "#94A3B8",
        "text-muted": "#64748B",
        mint: "#10B981",
        burn: "#EF4444",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "12px",
        input: "8px",
      },
      backgroundImage: {
        // Subtle page-level gradient — not on cards
        "gradient-page":
          "radial-gradient(ellipse at 20% 0%, #1A2035 0%, #0B0E17 60%)",
        "gradient-surface":
          "linear-gradient(135deg, #111827 0%, #0B0E17 100%)",
      },
      boxShadow: {
        // Clean, professional shadows — no glow
        card: "0 1px 3px rgba(0,0,0,0.35), 0 0 0 1px rgba(42,51,80,0.7)",
        "card-hover":
          "0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(59,130,246,0.2)",
        input: "0 1px 2px rgba(0,0,0,0.2), 0 0 0 1px rgba(42,51,80,0.8)",
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.25s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(3px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
