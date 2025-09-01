/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        changeBg: {
          "0%": { backgroundImage: 'url("/images/check.jpg")' },
          "50%": { backgroundImage: 'url("/images/check2.jpg")' },
          "80%": { backgroundImage: 'url("/images/check3.jpg")' },
          "100%": { backgroundImage: 'url("/images/check.jpg")' },
        },
      },
      animation: {
        changeBg: "changeBg 12s step-end infinite",
      },
    },
  },
  plugins: [],
};
