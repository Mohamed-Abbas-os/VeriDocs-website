/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#06080c',
          900: '#0a0d13',
          800: '#0f141c',
          700: '#171e29',
          600: '#222b39',
        },
        signal: {
          DEFAULT: '#3fd4ff',
          dim: '#1c8fb3',
        },
        azure: '#5b8cff',
      },
      fontFamily: {
        sans: ['Onest', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      animation: {
      },
    },
  },
  plugins: [],
};
