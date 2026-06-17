import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef8ef",
          100: "#d9f0dc",
          200: "#b7e2bf",
          300: "#89cc9a",
          400: "#5ab475",
          500: "#219c59",
          600: "#147f45",
          700: "#145c37",
          800: "#123b25",
          900: "#0f281a"
        },
        cream: "#f7f6f0",
        ink: "#101828"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 40, 26, 0.08)",
        card: "0 12px 32px rgba(16, 24, 40, 0.08)"
      },
      borderRadius: {
        '3xl': '1.75rem',
        '4xl': '2.25rem'
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      backgroundImage: {
        softgrid: "radial-gradient(circle at 20px 20px, rgba(20, 127, 69, 0.08) 1px, transparent 0)",
        hero: "linear-gradient(135deg, rgba(238,248,239,.9) 0%, rgba(255,255,255,.95) 52%, rgba(246,223,141,.2) 100%)"
      }
    }
  },
  plugins: []
};
export default config;
