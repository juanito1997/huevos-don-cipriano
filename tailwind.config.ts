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
        brand: {
          50:  "#FDF6EC", // beige claro — fondo general
          100: "#F5E6C8", // crema — superficies, bordes suaves
          200: "#E8D0A0", // crema oscura — bordes de inputs
          300: "#D4B07C", // dorado medio — placeholder / texto secundario
          400: "#BA8C5A", // café dorado — texto de apoyo
          500: "#8B5E3C", // acento dorado — foco / iconos
          600: "#6B4226", // café medio — hover
          700: "#4a2c0a", // café oscuro — primario (botones, header)
          800: "#3a2008", // más oscuro — active
          900: "#2a1605", // más oscuro — texto fuerte
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
