/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B1D33',
          light: '#132C4C',
        },
        parchment: '#F4F1EA',
        brass: {
          DEFAULT: '#B08D57',
          light: '#D4B483',
        },
        sage: {
          DEFAULT: '#8A9A7E',
          light: '#A8B89C',
        },
      },
      keyframes: {
        'orb-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.55' },
          '50%': { transform: 'scale(1.08)', opacity: '0.75' },
        },
        'orb-drift': {
          '0%, 100%': { transform: 'translate(0px, 0px)' },
          '25%': { transform: 'translate(20px, -30px)' },
          '50%': { transform: 'translate(-15px, 20px)' },
          '75%': { transform: 'translate(25px, 15px)' },
        },
      },
      animation: {
        'orb-pulse': 'orb-pulse 6s ease-in-out infinite',
        'orb-drift': 'orb-drift 12s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
