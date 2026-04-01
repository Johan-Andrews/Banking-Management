/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        shell: '#cbb5c4',
        app: '#f3eee8',
        card: '#e6dce3',
        elevated: '#ffffff',
        primary: '#4a3f48',
        secondary: '#877685',
        accent: {
          rose: '#df7b89',
          teal: '#6eb3b0',
          gold: '#ebb661',
          purple: '#877685'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
      borderRadius: {
        '40px': '40px',
        '30px': '30px',
        '24px': '24px',
        '20px': '20px',
      }
    },
  },
  plugins: [],
}
