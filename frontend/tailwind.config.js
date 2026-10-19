/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pnj: {
          dark: '#083316',
          medium: '#0a421d',
          light: '#10b981',
        }
      },
      fontFamily: {
        // Override default sans-serif dengan Poppins
        sans: ['Poppins', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

