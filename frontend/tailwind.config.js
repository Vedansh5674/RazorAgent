/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        razorpay: {
          blue: '#0c2340',
          accent: '#3395ff',
          dark: '#07162c',
          light: '#f5f7fa',
        },
        whatsapp: {
          green: '#25D366',
          teal: '#128C7E',
          dark: '#075E54',
          light: '#ECE5DD',
        }
      }
    },
  },
  plugins: [],
}
