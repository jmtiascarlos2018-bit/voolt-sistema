/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          navy:    '#0f172a',
          blue:    '#2563eb',
          green:   '#10b981',
          yellow:  '#f59e0b',
          purple:  '#8b5cf6',
          red:     '#ef4444',
          wpp:     '#25d366',
        },
      },
    },
  },
  plugins: [],
}
