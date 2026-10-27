/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#1e40af',
          600: '#1d4ed8',
          700: '#1e40af',
          primary: '#1e40af',
          accent: '#0284c7',
        }
      }
    },
  },
  plugins: [],
};
