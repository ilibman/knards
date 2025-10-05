/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
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
      red: {
        DEFAULT: 'var(--color-red)',
        light: 'var(--color-red-light)',
        dark: 'var(--color-red-dark)',
      },
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