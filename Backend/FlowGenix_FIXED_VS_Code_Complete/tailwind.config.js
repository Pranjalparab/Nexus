/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        kpop: {
          primary: '#FF6B9D',
          secondary: '#A855F7',
          accent: '#06D6A0',
          dark: '#2D1B69'
        },
        anime: {
          primary: '#FF4081',
          secondary: '#536DFE',
          accent: '#FFC107',
          dark: '#1A1A2E'
        },
        car: {
          primary: '#FF5722',
          secondary: '#607D8B',
          accent: '#FFC107',
          dark: '#212121'
        },
        music: {
          primary: '#9C27B0',
          secondary: '#E91E63',
          accent: '#00BCD4',
          dark: '#1A1A1A'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      fontFamily: {
        'kpop': ['Noto Sans KR', 'sans-serif'],
        'anime': ['Noto Sans JP', 'sans-serif'],
        'futuristic': ['Orbitron', 'monospace'],
        'music': ['Dancing Script', 'cursive'],
      },
      backgroundImage: {
        'gradient-kpop': 'linear-gradient(135deg, #FF6B9D 0%, #A855F7 100%)',
        'gradient-anime': 'linear-gradient(135deg, #FF4081 0%, #536DFE 100%)',
        'gradient-car': 'linear-gradient(135deg, #FF5722 0%, #607D8B 100%)',
        'gradient-music': 'linear-gradient(135deg, #9C27B0 0%, #E91E63 100%)',
      }
    },
  },
  plugins: [],
}
