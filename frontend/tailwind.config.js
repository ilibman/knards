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
        DEFAULT: 'var(--color-brown)',
        light: 'var(--color-brown-light)',
      },
      green: 'var(--color-green)',
      blue: {
        DEFAULT: 'var(--color-blue)',
        light: 'var(--color-blue-light)'
      },
      yellow: 'var(--color-yellow)',
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