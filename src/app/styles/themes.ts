export interface Theme {
  name:
    | "default"
    | "ocean"
    | "forest"
    | "volcano"
    | "sunset"
    | "desert"
    | "lavender"
    | "rainbow"
    | "twilight";
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
    name: "default",
    label: "Default",
    colors: {
      themeColor: "#2795ba",
      gradientOne: "#67c6b5",
      gradientTwo: "#2795ba",
      gradientThree: "#cb2048",
      accentPrimary: "#ffd700",
      accentSecondary: "#fff3b0",
    },
  },
  ocean: {
    name: "ocean",
    label: "Ocean",
    colors: {
      themeColor: "#2795ba",
      gradientOne: "#67c6b5",
      gradientTwo: "#2795ba",
      gradientThree: "#0e52cf",
      accentPrimary: "#ffd700",
      accentSecondary: "#fff3b0",
    },
  },
  forest: {
    name: "forest",
    label: "Forest",
    colors: {
      themeColor: "#2d5a27",
      gradientOne: "#8fca7c",
      gradientTwo: "#2d5a27",
      gradientThree: "#1c3c15",
      accentPrimary: "#ff7f50",
      accentSecondary: "#ffd4c5",
    },
  },
  volcano: {
    name: "volcano",
    label: "Volcano",
    colors: {
      themeColor: "#cc2c2c",
      gradientOne: "#ff6b6b",
      gradientTwo: "#cc2c2c",
      gradientThree: "#8b0000",
      accentPrimary: "#ffd700",
      accentSecondary: "#fff7d6",
    },
  },
  sunset: {
    name: "sunset",
    label: "Sunset",
    colors: {
      themeColor: "#ff7e00",
      gradientOne: "#ffb347",
      gradientTwo: "#ff7e00",
      gradientThree: "#cc5500",
      accentPrimary: "#4169e1",
      accentSecondary: "#c7d3f7",
    },
  },
  desert: {
    name: "desert",
    label: "Desert",
    colors: {
      themeColor: "#ffd700",
      gradientOne: "#fff68f",
      gradientTwo: "#ffd700",
      gradientThree: "#daa520",
      accentPrimary: "#4682b4",
      accentSecondary: "#b0c4de",
    },
  },
  lavender: {
    name: "lavender",
    label: "Lavender",
    colors: {
      themeColor: "#9b4f96",
      gradientOne: "#d8a1d4",
      gradientTwo: "#9b4f96",
      gradientThree: "#663399",
      accentPrimary: "#98fb98",
      accentSecondary: "#e0fff0",
    },
  },
  rainbow: {
    name: "rainbow",
    label: "Rainbow",
    colors: {
      themeColor: "#ff1493",
      gradientOne: "#ff69b4",
      gradientTwo: "#ff1493",
      gradientThree: "#8b008b",
      accentPrimary: "#ffd700",
      accentSecondary: "#fffacd",
    },
  },
  twilight: {
    name: "twilight",
    label: "Twilight",
    colors: {
      themeColor: "#98058b", // Derived from the purple end of the gradient
      gradientOne: "#f99777", // Coral/peach from the gradient
      gradientTwo: "#98058b", // Deep purple from the gradient
      gradientThree: "#62379a", // Slightly lighter purple for contrast
      accentPrimary: "#ffd700", // Keeping the standard accent
      accentSecondary: "#fff3b0", // Keeping the standard secondary accent
    },
  },
} as const;

// Helper function to apply theme
export function applyTheme(themeName: Theme["name"]) {
  const theme = themes[themeName];
  const root = document.documentElement;

  // Apply all theme colors as CSS custom properties
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });
}
