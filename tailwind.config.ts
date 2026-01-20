import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // BridgeSpec warm cream palette
        background: {
          DEFAULT: "#F5F3EE",
          sidebar: "#EDEAE4",
          card: "#FFFFFF",
        },
        foreground: {
          DEFAULT: "#1A1A1A",
          secondary: "#666666",
          muted: "#999999",
        },
        border: {
          DEFAULT: "#E5E2DC",
        },
        accent: {
          DEFAULT: "#1A1A1A",
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        DEFAULT: "8px",
      },
    },
  },
  plugins: [typography],
};

export default config;
