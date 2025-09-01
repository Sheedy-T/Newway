// postcss.config.js
module.exports = {
  plugins: [
    require('@tailwindcss/postcss')(),  // ✅ New plugin
    require('autoprefixer'),
  ],
};


  