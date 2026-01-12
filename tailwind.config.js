/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse-custom 12s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'mesh-blob': 'mesh-movement 20s ease-in-out infinite',
      },
      keyframes: {
        'pulse-custom': {
          '0%, 100%': { opacity: 0.3, transform: 'scale(1)' },
          '50%': { opacity: 0.6, transform: 'scale(1.1)' },
        },
        'mesh-movement': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(10%, -10%) scale(1.2)' },
          '66%': { transform: 'translate(-5%, 15%) scale(0.9)' },
        }
      }
    }
  },
  plugins: [
    require("tailwindcss-animate")
  ],
}