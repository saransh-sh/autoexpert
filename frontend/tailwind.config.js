/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B1120',
        card: '#111827',
        cardHover: '#1F2937',
        border: '#1E293B',
        borderMuted: '#334155',
        primary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          light: '#60A5FA',
          subtle: '#1E3A8A',
        },
        accent: '#06B6D4',
        critical: {
          DEFAULT: '#EF4444',
          bg: '#450A0A',
          border: '#B91C1C',
        },
        warning: {
          DEFAULT: '#F59E0B',
          bg: '#451A03',
          border: '#D97706',
        },
        success: {
          DEFAULT: '#10B981',
          bg: '#064E3B',
          border: '#059669',
        },
      },
    },
  },
  plugins: [],
}
