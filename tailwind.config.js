/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        navy: "var(--color-navy)",
        teal: "var(--color-teal)",
        gold: "var(--color-gold)",
        danger: "var(--color-danger)"
      },
      boxShadow: {
        soft: "0 20px 55px rgba(22, 40, 63, 0.08)"
      }
    }
  },
  plugins: []
};
