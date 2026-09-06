/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--rgb-background) / <alpha-value>)",
        surface: "rgb(var(--rgb-surface) / <alpha-value>)",
        navy: "rgb(var(--rgb-navy) / <alpha-value>)",
        teal: "rgb(var(--rgb-teal) / <alpha-value>)",
        gold: "rgb(var(--rgb-gold) / <alpha-value>)",
        danger: "rgb(var(--rgb-danger) / <alpha-value>)"
      },
      boxShadow: {
        soft: "0 4px 16px rgba(22, 40, 63, 0.04)"
      }
    }
  },
  plugins: []
};
