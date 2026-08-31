/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          red: '#ff1744',
          blue: '#2979ff',
          green: '#00e676',
          yellow: '#ffea00',
          purple: '#d500f9',
          cyan: '#00e5ff',
        }
      },
      fontFamily: {
        racing: ['Impact', 'Arial Black', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
