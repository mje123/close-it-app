/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#3EABA2',
          50: '#EBF7F6',
          100: '#D0EEEC',
          500: '#3EABA2',
          600: '#349990',
          700: '#2A877F',
        },
        coral: '#E74C3C',
        charcoal: '#2C2C2C',
        cream: '#FFFACD',
        'cream-bg': '#F5F5F0',
        'sidebar-green': '#5FAD56',
        'sidebar-yellow': '#F39C12',
        'sidebar-pink': '#E84B72',
        'sidebar-orange': '#E86742',
        'sidebar-teal': '#3EABA2',
        'sidebar-red': '#C0392B',
        'sidebar-blue': '#3498DB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
