/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          900: '#070B19',
          800: '#0B132B',
          700: '#141E3D',
          600: '#1C2541',
        },
        rosegold: {
          100: '#FDF0F2',
          200: '#F9D8DD',
          300: '#E8B4B8',
          400: '#D48C94',
          500: '#B76E79',
          600: '#9B525E',
        },
        champagne: {
          100: '#FFFDF9',
          200: '#FBF3E4',
          300: '#F7E7CE',
          400: '#E8CE9F',
          500: '#D4AF37',
        },
        romantic: {
          pink: '#FFD1DC',
          ruby: '#E63946',
          glow: '#FFE5EC',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        handwriting: ['"Great Vibes"', 'cursive'],
      },
      boxShadow: {
        'rose-glow': '0 0 25px rgba(183, 110, 121, 0.35)',
        'gold-glow': '0 0 25px rgba(212, 175, 55, 0.35)',
        'envelope': '0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 30px rgba(183, 110, 121, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'sparkle': 'sparkle 2s ease-in-out infinite',
        'wiggle': 'wiggle 0.5s ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        sparkle: {
          '0%, 100%': { opacity: 0.3, transform: 'scale(0.8)' },
          '50%': { opacity: 1, transform: 'scale(1.2)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-5deg)' },
          '75%': { transform: 'rotate(5deg)' },
        }
      }
    },
  },
  plugins: [],
}
