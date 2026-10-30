/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#09090b',       // Deep obsidian black
          surface: '#121215',  // Dark card surface
          card: '#18181b',     // Card inner
          border: '#27272a',   // Subtle zinc border
          hover: '#222226',
        },
        light: {
          bg: '#f8fafc',
          surface: '#ffffff',
          card: '#f1f5f9',
          border: '#e2e8f0',
          hover: '#f8fafc',
        }
      }
    },
  },
  plugins: [],
}
