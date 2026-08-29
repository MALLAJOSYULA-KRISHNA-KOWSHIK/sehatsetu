/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Satoshi', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#CD7F81',
          hover: '#b87274',
        }
      }
    },
  },
  plugins: [],
}
