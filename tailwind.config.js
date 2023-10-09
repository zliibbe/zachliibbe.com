/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  // purge: [],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  prefix: "tw-",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plus-jakarta-sans)"],
        mono: ["var(--font-roboto-mono)"],
      },
      colors: {
        primary: "#000000",
        secondary: "ffffff",
      },
    },
  },
  plugins: [],
};
