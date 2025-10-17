/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neo-brutalist color palette
        brutal: {
          black: '#000000',
          white: '#FFFFFF',
          yellow: '#FFE500',
          pink: '#FF006E',
          cyan: '#00F0FF',
          lime: '#CCFF00',
          orange: '#FF6B00',
          purple: '#9D00FF',
        },
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px #000000',
        'brutal-lg': '8px 8px 0px 0px #000000',
        'brutal-xl': '12px 12px 0px 0px #000000',
        'brutal-sm': '2px 2px 0px 0px #000000',
      },
      borderWidth: {
        'brutal': '3px',
      },
    },
  },
  plugins: [],
}

