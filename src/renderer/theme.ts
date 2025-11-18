export const loxraTheme = {
  brand: {
    name: 'Loxra',
    tagline: 'Intelligence for the New Financial System.'
  },
  typography: {
    h1: { size: '28px', line: '32px', weight: 700 },
    h2: { size: '22px', line: '28px', weight: 700 },
    h3: { size: '18px', line: '24px', weight: 600 },
    body: { size: '14px', line: '20px', weight: 400 },
    label: { size: '12px', line: '16px', weight: 600 }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px'
  },
  colors: {
    background: '#0B0C10',
    surface: '#101219',
    panel: '#12141D',
    text: '#FFFFFF',
    muted: '#A3A9B3',
    accent: '#2F7DF6',
    accentSoft: 'rgba(47, 125, 246, 0.12)',
    border: '#1C1F2A',
    mint: '#65FBD2'
  }
};

export type LoxraTheme = typeof loxraTheme;
