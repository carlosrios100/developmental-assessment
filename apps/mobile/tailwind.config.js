/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Domain colors
        communication: '#3b82f6',
        'gross-motor': '#22c55e',
        'fine-motor': '#f59e0b',
        'problem-solving': '#8b5cf6',
        'personal-social': '#ec4899',
        // Risk level colors
        typical: '#22c55e',
        monitoring: '#eab308',
        'at-risk': '#f97316',
        concern: '#ef4444',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
