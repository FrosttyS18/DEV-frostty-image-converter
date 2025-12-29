/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'frostty-purple': '#7B3FF2',
        'frostty-blue': '#4F46E5',
        'frostty-dark': '#0A0A0F',
        'frostty-card': 'rgba(15, 15, 25, 0.6)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
