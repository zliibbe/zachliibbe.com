export interface Theme {
  name:
    | 'default'
    | 'ocean'
    | 'forest'
    | 'evergreen'
    | 'sunset'
    | 'lotusBloom'
    | 'twilight'
    | 'aurora-borealis';
  label: string;
  colors: {
    themeColor: string;
    gradientOne: string;
    gradientTwo: string;
    gradientThree: string;
    accentPrimary: string;
    accentSecondary: string;
  };
}

export const themes = {
  default: {
    name: 'default',
    label: 'Default',
    colors: {
      themeColor: '#1a6b8a',
      gradientOne: '#67c6b5',
      gradientTwo: '#2795ba',
      gradientThree: '#cb2048',
      accentPrimary: '#ff5b4a',
      accentSecondary: '#e8f6fa',
    },
  },
  ocean: {
    name: 'ocean',
    label: 'Ocean Depths',
    colors: {
      themeColor: '#2563eb',
      gradientOne: '#478bd6',
      gradientTwo: '#478bd6',
      gradientThree: '#25d8d3',
      accentPrimary: '#ffd700',
      accentSecondary: '#fff3b0',
    },
  },
  forest: {
    name: 'forest',
    label: 'Forest',
    colors: {
      themeColor: '#2d5a27',
      gradientOne: '#8fca7c',
      gradientTwo: '#2d5a27',
      gradientThree: '#1c3c15',
      accentPrimary: '#ff7f50',
      accentSecondary: '#ffd4c5',
    },
  },
  evergreen: {
    name: 'evergreen',
    label: 'Evergreen',
    colors: {
      themeColor: '#15803d',
      gradientOne: '#0eae57',
      gradientTwo: '#0c7475',
      gradientThree: '#0c7475',
      accentPrimary: '#ff7043',
      accentSecondary: '#e8f5f5',
    },
  },
  sunset: {
    name: 'sunset',
    label: 'Sunset',
    colors: {
      themeColor: '#c2410c',
      gradientOne: '#ffb347',
      gradientTwo: '#ff7e00',
      gradientThree: '#cc5500',
      accentPrimary: '#4169e1',
      accentSecondary: '#c7d3f7',
    },
  },
  twilight: {
    name: 'twilight',
    label: 'Twilight',
    colors: {
      themeColor: '#7c2d92',
      gradientOne: '#f99777',
      gradientTwo: '#98058b',
      gradientThree: '#62379a',
      accentPrimary: '#ffd700',
      accentSecondary: '#fff3b0',
    },
  },
  lotusBloom: {
    name: 'lotusBloom',
    label: 'Lotus Bloom',
    colors: {
      themeColor: '#be185d',
      gradientOne: '#ff69b4',
      gradientTwo: '#ff1493',
      gradientThree: '#8b008b',
      accentPrimary: '#ffd700',
      accentSecondary: '#fffacd',
    },
  },
  'aurora-borealis': {
    name: 'aurora-borealis',
    label: 'Aurora Borealis',
    colors: {
      themeColor: '#7c3aed',
      gradientOne: '#982dff',
      gradientTwo: '#5af1ff',
      gradientThree: '#41ef64',
      accentPrimary: '#ff4081',
      accentSecondary: '#f0f7ff',
    },
  },
} as const;

// Helper function to apply theme
export function applyTheme(themeName: Theme['name']) {
  const theme = themes[themeName];
  const root = document.documentElement;

  // Apply all theme colors as CSS custom properties
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });
}
