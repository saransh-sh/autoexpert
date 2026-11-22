/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Space Mono"', 'Consolas', 'Courier New', 'monospace'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        background: '#13111C',
        surface: '#1E1A29',
        card: '#1E1A29',
        cardHover: '#262135',
        border: '#000000',
        borderMuted: '#352D45',
        foreground: '#FFFDF9',
        foregroundMuted: '#B8B0C8',
        hack: {
          orange: '#FF7844',
          sunset: '#FF8800',
          magenta: '#FF4785',
          mint: '#49D49D',
          yellow: '#FED156',
          plum: '#13111C',
          deep: '#1E1A29',
          border: '#000000',
        },
        primary: {
          DEFAULT: '#FF7844',
          hover: '#FF8800',
          light: '#FFA07A',
          subtle: '#2D1A15',
          foreground: '#000000',
        },
        accent: '#FF4785',
        warning: {
          DEFAULT: '#FED156',
          bg: '#2A2412',
          border: '#FED156',
          foreground: '#000000',
        },
        success: {
          DEFAULT: '#49D49D',
          bg: '#11291F',
          border: '#49D49D',
          foreground: '#000000',
        },
        critical: {
          DEFAULT: '#FF4785',
          bg: '#2C131D',
          border: '#FF4785',
          foreground: '#FFFFFF',
        },
      },
      boxShadow: {
        'neo-sm': '2px 2px 0px #000000',
        'neo': '4px 4px 0px #000000',
        'neo-lg': '6px 6px 0px #000000',
        'neo-xl': '8px 8px 0px #000000',
        'neo-orange': '4px 4px 0px #FF7844',
        'neo-mint': '4px 4px 0px #49D49D',
        'neo-yellow': '4px 4px 0px #FED156',
        'neo-magenta': '4px 4px 0px #FF4785',
      },
      borderWidth: {
        '3': '3px',
      },
      letterSpacing: {
        tightest: '-0.03em',
        telemetry: '0.06em',
      },
    },
  },
  plugins: [],
}
