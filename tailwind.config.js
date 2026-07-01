/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#030506',
          900: '#050809',
          800: '#0b1114',
          700: '#111a1f',
        },
      },
    },
  },
  plugins: [],
};
