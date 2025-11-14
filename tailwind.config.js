/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0A0E27',
        'dark-card': '#1A1F3A',
        'toxic-green': '#00FF88',
        'neon-purple': '#9D4EDD',
      },
    },
  },
  plugins: [],
}
