import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Vyra background palette
        fog: {
          DEFAULT: "#E8EEF5",
          deep: "#D4DFED",
          soft: "#DFE8F0",
        },
        ink: {
          DEFAULT: "#0F1924", // primary text
          soft: "#3D5A7A", // secondary text
          muted: "#6B87A8", // helper text
        },
        footer: "#1A1F2E",
        // accent colors (data / charts only)
        accent: {
          green: "#7EC8B0",
          gold: "#E8C84A",
          blue: "#6B9EC8",
          ai: "#9B8EF5",
        },
        // primary CTA from the screenshot (indigo/blue)
        brand: {
          DEFAULT: "#4F46E5",
          hover: "#4338CA",
          soft: "#EEF0FE",
        },
        // landing page tokens (scoped; do not affect app UI)
        landing: {
          bg: "#F4F7FA",
          ink: "#1E293B",
          muted: "#64748B",
          cta: "#0F1924",
          "accent-blue": "#60A5FA",
          "accent-teal": "#2DD4BF",
          "accent-purple": "#A78BFA",
          "accent-amber": "#FBBF24",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "'Playfair Display'", "serif"],
      },
      borderRadius: {
        pill: "4px",
        card: "12px",
        panel: "16px",
        metric: "14px",
        landing: "24px",
      },
      boxShadow: {
        card: "0 4px 24px rgba(15,25,36,0.08), 0 1px 4px rgba(15,25,36,0.04)",
        "card-hover":
          "0 8px 40px rgba(15,25,36,0.12), 0 2px 8px rgba(15,25,36,0.06)",
        data: "0 12px 48px rgba(15,25,36,0.15), 0 4px 12px rgba(15,25,36,0.08)",
        landing:
          "0 4px 24px rgba(30,41,59,0.06), 0 1px 4px rgba(30,41,59,0.04)",
        "landing-lg":
          "0 12px 40px rgba(30,41,59,0.1), 0 4px 12px rgba(30,41,59,0.06)",
      },
      maxWidth: {
        content: "1100px",
      },
    },
  },
  plugins: [],
};

export default config;
