/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['HelveticaNowDisplay-Medium', 'Helvetica Neue', 'Arial', 'sans-serif'],
        body: ['HelveticaNowDisplayW01-Rg', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        'fade-in-up': 'fade-in-up 0.4s ease forwards',
      },
    },
  },
  plugins: [],
};
