import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "var(--primary-purple-50)",
          100: "var(--primary-purple-100)",
          200: "var(--primary-purple-200)",
          300: "var(--primary-purple-300)",
          400: "var(--primary-purple-400)",
          500: "var(--primary-purple-500)",
          600: "var(--primary-purple-600)",
          700: "var(--primary-purple-700)",
          800: "var(--primary-purple-800)",
          900: "var(--primary-purple-900)",
          DEFAULT: "var(--primary-purple-600)",
        },
        accent: {
          50: "var(--accent-yellow-50)",
          100: "var(--accent-yellow-100)",
          200: "var(--accent-yellow-200)",
          300: "var(--accent-yellow-300)",
          400: "var(--accent-yellow-400)",
          500: "var(--accent-yellow-500)",
          600: "var(--accent-yellow-600)",
          700: "var(--accent-yellow-700)",
          800: "var(--accent-yellow-800)",
          900: "var(--accent-yellow-900)",
          DEFAULT: "var(--accent-yellow-400)",
        },
      },
      backgroundColor: {
        surface: "var(--color-surface)",
        background: "var(--color-background)",
      },
      textColor: {
        primary: "var(--color-text-primary)",
        secondary: "var(--color-text-secondary)",
      },
      borderColor: {
        DEFAULT: "var(--color-border)",
      },
    },
  },
  plugins: [],
};

export default config;
