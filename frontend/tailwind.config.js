/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep navy - primary brand
        navy: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#1e3a5f',
          600: '#162d4b',
          700: '#0f2137',
          800: '#091828',
          900: '#040e18',
        },
        // Warm gold - accent
        gold: {
          300: '#fcd34d',
          400: '#f5c518',
          500: '#e8b400',
          600: '#c99a00',
        },
        // Ocean teal - secondary
        teal: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
        // Warm sand - background
        sand: {
          50: '#fdfaf5',
          100: '#faf4e8',
          200: '#f3e8d0',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #040e18 0%, #0f2137 40%, #162d4b 70%, #1a3a5c 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)',
        'gold-gradient': 'linear-gradient(90deg, #f5c518 0%, #e8b400 100%)',
      },
      boxShadow: {
        'premium': '0 4px 24px -4px rgba(4, 14, 24, 0.3), 0 1px 3px rgba(4, 14, 24, 0.1)',
        'premium-lg': '0 20px 60px -10px rgba(4, 14, 24, 0.4)',
        'gold-glow': '0 0 20px rgba(245, 197, 24, 0.3)',
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.12)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245, 197, 24, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(245, 197, 24, 0)' },
        },
      },
    },
  },
  plugins: [],
}
