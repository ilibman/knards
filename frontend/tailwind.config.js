/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      black: 'var(--color-black)',
      white: 'var(--color-white)',
      brown: {
        default: 'var(--color-brown)',
        light: 'var(--color-brown-light)',
      },
      green: 'var(--color-green)',
      blue: {
        default: 'var(--color-blue)',
        light: 'var(--color-blue-light)'
      },
      red: 'var(--color-red)',
    },
    extend: {
      fontFamily: {
        base: 'var(--font-base)',
        code: 'var(--font-code)',
      }
    },
  },
  plugins: [],
}