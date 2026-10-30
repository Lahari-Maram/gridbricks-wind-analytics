/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0b1329',
          800: '#111e3f',
          700: '#1b2d5d',
        },
        wind: {
          DEFAULT: '#0284c7', // Sky blue
          glow: '#38bdf8',
        },
        actual: {
          DEFAULT: '#10b981', // Emerald green
        },
        deficit: {
          DEFAULT: '#ef4444', // Red (Overforecast / deficit)
        },
        surplus: {
          DEFAULT: '#f59e0b', // Amber (Underforecast / surplus)
        }
      }
    },
  },
  plugins: [],
}
