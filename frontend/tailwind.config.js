/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    borderRadius: {
      none: '0px',
      DEFAULT: '0px',
      sm: '0px',
      md: '0px',
      lg: '0px',
      xl: '0px',
      '2xl': '0px',
      '3xl': '0px',
      full: '0px',
    },
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Space Mono"', 'Consolas', 'Courier New', 'monospace'],
        sans: ['"JetBrains Mono"', '"Space Mono"', 'Consolas', 'Courier New', 'monospace'],
      },
      colors: {
        background: '#0A0A0A',
        card: '#121212',
        cardHover: '#181818',
        border: '#262626',
        borderMuted: '#1E1E1E',
        foreground: '#EAEAEA',
        primary: {
          DEFAULT: '#E61919',
          hover: '#FF2A2A',
          light: '#FF5555',
          subtle: '#260505',
          foreground: '#FFFFFF',
        },
        accent: '#E61919',
        hazard: '#E61919',
        terminalGreen: '#4AF626',
        critical: {
          DEFAULT: '#E61919',
          bg: '#260505',
          border: '#E61919',
        },
        warning: {
          DEFAULT: '#F59E0B',
          bg: '#261805',
          border: '#B45309',
        },
        success: {
          DEFAULT: '#4AF626',
          bg: '#081F08',
          border: '#4AF626',
        },
      },
      letterSpacing: {
        telemetry: '0.08em',
        widest: '0.15em',
      },
    },
  },
  plugins: [],
}
