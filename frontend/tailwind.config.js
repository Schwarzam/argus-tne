/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    
    extend: {
      colors: {
        'primary': '#2E468C',
        'secondary': '#2C3D73',
        'tertiary': '#2E4959',
        'quaternary': '#8F628D',
        'quinary': '#B68791',
      },
    },
  },
  plugins: [],
}
