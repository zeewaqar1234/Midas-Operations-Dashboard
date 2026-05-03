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
        // Midas brand palette
        background: "#0A0A0F",
        surface: "#111118",
        "surface-2": "#1A1A24",
        "surface-3": "#22222E",
        border: "#2A2A3A",
        accent: "#00D4FF",
        "accent-hover": "#00B8E0",
        success: "#00C48C",
        warning: "#FFB800",
        danger: "#FF4444",
        "text-primary": "#F0F0F8",
        "text-secondary": "#9090A8",
        "text-muted": "#60607A",
        mint: "#00C48C",
        burn: "#FF4444",
      },
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "gradient-surface":
          "linear-gradient(135deg, #111118 0%, #0A0A0F 100%)",
        "gradient-accent":
          "linear-gradient(135deg, #00D4FF20 0%, #00D4FF05 100%)",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(42,42,58,0.6)",
        "card-hover":
          "0 4px 12px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,212,255,0.2)",
        glow: "0 0 20px rgba(0,212,255,0.15)",
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
