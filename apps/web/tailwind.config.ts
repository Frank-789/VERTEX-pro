import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        "background-secondary": "#f7f8fa",
        foreground: "#111827",
        muted: "#6b7280",
        border: "#e5e7eb",
        primary: "#2563eb",
        "primary-hover": "#1d4ed8",
        accent: "#f97316",
        "accent-hover": "#ea580c",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
        surface: "#ffffff",
        "surface-hover": "#f9fafb",
        dark: {
          bg: "#0f1115",
          panel: "#171a20",
          border: "#2a2f3a",
          text: "#f5f6f8",
          "text-muted": "#9ca3af",
          surface: "#1a1d27",
          "surface-hover": "#22263a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      maxWidth: {
        chat: "48rem",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)",
        "card-hover":
          "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
