/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFAF6',
          100: '#F7F2EB',
          200: '#EDE8E0',
          300: '#E0D9CF',
        },
        sand: {
          300: '#D4BB9A',
          400: '#C4A47C',
          500: '#A8865A',
          600: '#8C6D43',
        },
        blush: {
          100: '#F5E8EA',
          200: '#EDD2D6',
          300: '#DFB3BA',
          400: '#C98A94',
          500: '#B0626E',
        },
        sage: {
          300: '#AABFB2',
          400: '#84A893',
          500: '#5E9073',
          600: '#427358',
        },
        warm: {
          50: '#F9F5F1',
          100: '#EFE8DF',
          200: '#D9CFC4',
          400: '#9C8C7E',
          600: '#5C4A3D',
          700: '#3D2E24',
          800: '#2A1F18',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0,0,0,0.06), 0 1px 6px -2px rgba(0,0,0,0.04)',
        card: '0 4px 24px -6px rgba(0,0,0,0.10)',
        'sheet': '0 -4px 30px -6px rgba(0,0,0,0.14)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'slide-up': 'slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-in': 'fadeIn 0.25s ease-out',
        'bounce-soft': 'bounceSoft 0.5s ease',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
      },
    },
  },
  plugins: [],
}
