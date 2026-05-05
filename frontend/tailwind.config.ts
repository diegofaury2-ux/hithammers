import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: { DEFAULT: '#0a0a0a', 100: '#111111', 200: '#1a1a1a', 300: '#242424', 400: '#2a2a2a', 500: '#303030', 600: '#404040' },
        card: '#1e1e1e',
        border: '#2e2e2e',
        muted: '#929292',
        subtle: '#707070',
        'text-primary': '#ffffff',
        'text-secondary': '#d8d8d8',
        green: { DEFAULT: '#2C5A52', light: '#3a7268', dark: '#1e3e38' },
        neon: { DEFAULT: '#CCFF00', dark: '#aadd00' },
        mint: '#C5FFC8',
        critical: { DEFAULT: '#FF0000', dark: '#940000', bg: '#2a0000' },
        warning: { DEFAULT: '#FF9900', dark: '#cc7a00', bg: '#2a1a00' },
        info: { DEFAULT: '#FFD600', bg: '#2a2400' },
        pink: '#FFBABA',
        peach: '#FFD492',
        cream: '#FFF0A3',
        status: {
          todo: '#707070',
          in_progress: '#3b82f6',
          done: '#22c55e',
          overdue: '#ef4444',
        },
        priority: {
          critical: '#ef4444',
          high: '#f97316',
          medium: '#eab308',
          low: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
