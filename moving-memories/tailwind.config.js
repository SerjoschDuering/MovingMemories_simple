/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Moving memories theme - warm, nostalgic colors
        memory: {
          50: '#fdf8f4',
          100: '#f9eddb',
          200: '#f3dab6',
          300: '#eac087',
          400: '#dfa055',
          500: '#d88634',
          600: '#ca7029',
          700: '#a85824',
          800: '#874823',
          900: '#6f3c20',
          950: '#3c1e0f',
        },
        sepia: {
          50: '#fef9f3',
          100: '#fef1e6',
          200: '#fce1c7',
          300: '#f9ca9d',
          400: '#f5ab71',
          500: '#f19150',
          600: '#e27c39',
          700: '#bc6330',
          800: '#965230',
          900: '#7a4529',
          950: '#422213',
        },
      },
      fontFamily: {
        'handwritten': ['Caveat', 'cursive'],
        'elegant': ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'scale-in': 'scaleIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'breathe': 'breathe 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}