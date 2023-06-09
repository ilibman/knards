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
      brown: 'var(--color-brown)',
      green: 'var(--color-green)',
      violet: {
        light: 'var(--color-violet-light)',
        dark: 'var(--color-violet-dark)'
      },
    },
    extend: {
      fontFamily: {
        code: ['Source Code Pro', 'mono'],
        base: ['Source Sans Pro', 'sans'],
      }
    },
  },
  plugins: [],
}