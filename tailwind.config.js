/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'glass-background': 'rgba(255, 255, 255, 0.1)',
        'glass-border': 'rgba(255, 255, 255, 0.2)',
        'foreground': 'rgb(var(--foreground))',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        'glass': '12px',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
  darkMode: 'class',
}