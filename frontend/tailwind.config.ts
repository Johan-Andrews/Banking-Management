/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f3eee8",
        foreground: "#4a3f48",
        shell: '#cbb5c4',
        app: '#f3eee8',
        card: {
          DEFAULT: '#e6dce3',
          foreground: "#4a3f48",
          alt: '#e6dce3',
        },
        elevated: '#ffffff',
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#4a3f48",
        },
        primary: {
          DEFAULT: '#4a3f48',
          foreground: "#ffffff",
          alt: '#4a3f48',
        },
        secondary: {
          DEFAULT: '#877685',
          foreground: "#ffffff",
          alt: '#877685',
        },
        muted: {
          DEFAULT: "#e6dce3",
          foreground: "#877685",
        },
        accent: {
          DEFAULT: '#df7b89',
          foreground: "#ffffff",
          rose: '#df7b89',
          teal: '#6eb3b0',
          gold: '#ebb661',
          purple: '#877685',
          destructive: '#df7b89'
        },
        destructive: {
          DEFAULT: '#df7b89',
          foreground: "#ffffff",
        },
        border: "#e6dce3",
        input: "#e6dce3",
        ring: "#877685",
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
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}
