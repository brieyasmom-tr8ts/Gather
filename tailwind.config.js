/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6F7F5',
          100: '#CCF0EB',
          200: '#99E1D7',
          300: '#85D8CE',
          400: '#5CC4B8',
          500: '#085078',
          600: '#064462',
          700: '#04374E',
          800: '#042B3E',
          900: '#021E2C',
        },
        gala: {
          dark: '#042B3E',
          deep: '#085078',
          mint: '#85D8CE',
          light: '#B8EAE4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'check': 'check 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        check: {
          from: { transform: 'scale(0)' },
          '50%': { transform: 'scale(1.2)' },
          to: { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
