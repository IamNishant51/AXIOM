/**
 * Theme System - Colors and styling abstraction
 * Premium TUI theme - easily swappable
 */

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textDim: string;
  textMuted: string;
  border: string;
  borderDim: string;
  success: string;
  error: string;
  warning: string;
  cursor: string;
  selection: string;
}

export interface ThemeBorders {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  top: string;
  bottom: string;
  left: string;
  right: string;
}

export interface Theme {
  colors: ThemeColors;
  borders: ThemeBorders;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    cursor: string;
    bullet: string;
    spinner: string[];
  };
}

// Default premium dark theme - refined minimalist palette
export const defaultTheme: Theme = {
  colors: {
    primary: "#60A5FA",      // Soft blue
    secondary: "#A78BFA",    // Soft purple
    accent: "#34D399",      // Soft green
    background: "#0D0D0D",  // Near black
    surface: "#171717",     // Dark gray
    text: "#F5F5F5",        // Off white
    textDim: "#A3A3A3",     // Medium gray
    textMuted: "#525252",   // Dark gray
    border: "#404040",      // Medium dark
    borderDim: "#262626",   // Dark
    success: "#4ADE80",     // Green
    error: "#F87171",       // Red
    warning: "#FBBF24",     // Amber
    cursor: "#60A5FA",      // Blue cursor
    selection: "#374151",   // Selection bg
  },
  borders: {
    topLeft: "╭",
    topRight: "╮",
    bottomLeft: "╰",
    bottomRight: "╯",
    top: "─",
    bottom: "─",
    left: "│",
    right: "│",
  },
  spacing: {
    xs: 1,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 12,
  },
  typography: {
    cursor: "❯",
    bullet: "•",
    spinner: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  },
};

// Light theme variant
export const lightTheme: Theme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    background: "#FAFAFA",
    surface: "#F5F5F5",
    text: "#171717",
    textDim: "#525252",
    textMuted: "#A3A3A3",
    border: "#D4D4D4",
    borderDim: "#E5E5E5",
  },
};

// Current theme (can be swapped)
let currentTheme = defaultTheme;

export function setTheme(theme: Theme): void {
  currentTheme = theme;
}

export function getTheme(): Theme {
  return currentTheme;
}

// Helper to use theme in components
export function useTheme(): Theme {
  return currentTheme;
}