/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        brand: {
          primary: '#0284c7', // Sky 600
          secondary: '#0f172a', // Slate 900
          accent: '#f59e0b', // Amber 500
          danger: '#ef4444', // Red 500
          success: '#10b981', // Emerald 500
          warning: '#f97316', // Orange 500
        }
      }
    },
  },
  plugins: [],
}

