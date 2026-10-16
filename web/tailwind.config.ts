import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        card: "var(--card)",
        accent: "var(--accent)",
        obsidian: {
          950: "#04060a",
          900: "#080c16",
          850: "#0d1322",
          800: "#131b2e",
          750: "#18233a",
          700: "#22304d",
          600: "#324468",
        },
        tier1: "#10b981",
        tier2: "#f59e0b",
        tier3: "#6366f1",
        danger: "#f43f5e",
        // Color-wheel harmonic accents
        harmonic: {
          emerald: "#10b981",
          mint: "#34d399",
          cyan: "#06b6d4",
          ice: "#38bdf8",
          blue: "#3b82f6",
          indigo: "#6366f1",
          violet: "#8b5cf6",
          amber: "#f59e0b",
          gold: "#fbbf24",
          rose: "#f43f5e",
          ruby: "#e11d48",
        },
        navy: {
          950: "#04060a",
          900: "#080c16",
          850: "#0d1322",
          800: "#131b2e",
          700: "#22304d",
          600: "#324468",
        },
        authority: {
          emerald: "#10b981",
          cyan: "#06b6d4",
          blue: "#38bdf8",
          amber: "#f59e0b",
          rose: "#f43f5e",
        },
      },
      boxShadow: {
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-elevated": "0 12px 40px 0 rgba(0, 0, 0, 0.55), inset 0 1px 0 0 rgba(255, 255, 255, 0.12)",
        "glass-card": "0 4px 24px -1px rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)",
        "glow-emerald": "0 0 30px -5px rgba(16, 185, 129, 0.35)",
        "glow-cyan": "0 0 30px -5px rgba(6, 182, 212, 0.35)",
        "glow-amber": "0 0 30px -5px rgba(245, 158, 11, 0.35)",
        "glow-rose": "0 0 30px -5px rgba(244, 63, 94, 0.35)",
        "glow-indigo": "0 0 30px -5px rgba(99, 102, 241, 0.35)",
      },
      backdropBlur: {
        "xs": "2px",
        "3xl": "28px",
        "4xl": "40px",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          '"SF Mono"',
          "ui-monospace",
          "Menlo",
          "Monaco",
          "Consolas",
          '"Liberation Mono"',
          '"Courier New"',
          "monospace",
        ],
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-float": "glowFloat 8s ease-in-out infinite alternate",
      },
      keyframes: {
        glowFloat: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(15px, -15px) scale(1.05)" },
          "100%": { transform: "translate(-10px, 10px) scale(0.98)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
