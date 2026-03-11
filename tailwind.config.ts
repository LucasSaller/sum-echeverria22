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
      fontFamily: {
        sans: ["var(--font-outfit)", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#eef3ff",
          100: "#dce7ff",
          200: "#bfd2ff",
          300: "#93b4fd",
          400: "#608dfa",
          500: "#3b65f6",
          600: "#2a5bd7",
          700: "#1e46b8",
          800: "#1e3a96",
          900: "#1e3478",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
