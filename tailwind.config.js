/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF5F3',
          100: '#FFE8E3',
          200: '#FFD0C7',
          300: '#FFB0A0',
          400: '#FF8A73',
          500: '#E8553D',
          600: '#D44030',
          700: '#B93325',
          800: '#992C22',
          900: '#7F2720',
        },
        gala: {
          dark: '#1A0A0E',
          red: '#6B1520',
          navy: '#16213E',
          purple: '#2D1B69',
          gold: '#F5C842',
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
