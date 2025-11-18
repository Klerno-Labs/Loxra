/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/renderer/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0B0C10',
        'surface-strong': '#101219',
        panel: '#12141D',
        accent: '#2F7DF6',
        accentStrong: '#2F7DF6',
        outline: '#1C1F2A',
        muted: '#A3A9B3',
        danger: '#F97373',
        success: '#34D399',
        mint: '#65FBD2',
        paper: '#FFFFFF'
      },
      boxShadow: {
        soft: '0 22px 55px rgba(9, 12, 18, 0.55)',
        glow: '0 12px 32px rgba(47, 125, 246, 0.35)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace']
      }
    }
  },
  plugins: []
};
