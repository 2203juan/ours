/**
 * Colours resolve through CSS variables (see src/index.css), so switching to
 * dark mode swaps the variable values and every existing utility class follows
 * — `bg-cream-50` stays `bg-cream-50` in both themes. The alternative,
 * sprinkling `dark:` variants across every component, would have meant editing
 * hundreds of class strings.
 *
 * The channel triplet form (`R G B`) is what lets `<alpha-value>` keep working,
 * so `bg-white/70` and friends are unaffected.
 */
const withAlpha = (variable) => `rgb(var(${variable}) / <alpha-value>)`

const scale = (name, shades) =>
  Object.fromEntries(shades.map((s) => [s, withAlpha(`--c-${name}-${s}`)]))

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Surface white is themed too, so `bg-white` cards go dark with the app
        white: withAlpha('--c-white'),
        // Always-dark overlay behind sheets, in both themes
        scrim: withAlpha('--c-scrim'),
        // Genuinely white in both themes. For text sitting on something that
        // doesn't invert — avatar gradients, photos, the scrim — where themed
        // `white` would flip to dark and disappear.
        'pure-white': '#FFFFFF',
        cream: scale('cream', [50, 100, 200, 300]),
        sand: scale('sand', [50, 100, 200, 300, 400, 500, 600]),
        blush: scale('blush', [100, 200, 300, 400, 500]),
        sage: scale('sage', [100, 200, 300, 400, 500, 600, 700]),
        warm: scale('warm', [50, 100, 200, 300, 400, 500, 600, 700, 800]),
        red: scale('red', [50, 100, 200, 300, 400, 500, 700]),
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
