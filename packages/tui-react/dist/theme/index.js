/**
 * Theme System - Colors and styling abstraction
 * Premium TUI theme matching OpenClaude style
 */
import React, { createContext, useContext, useState } from "react";
// Default premium dark theme - OpenClaude inspired
export const defaultTheme = {
    colors: {
        // Primary brand (Claude orange)
        claude: "rgb(215,119,87)",
        claudeShimmer: "rgb(235,159,127)",
        primary: "rgb(215,119,87)",
        secondary: "rgb(177,185,249)",
        accent: "rgb(78,186,101)",
        // UI colors
        permission: "rgb(177,185,249)",
        permissionShimmer: "rgb(207,215,255)",
        planMode: "rgb(72,150,140)",
        ide: "rgb(71,130,200)",
        promptBorder: "rgb(136,136,136)",
        promptBorderShimmer: "rgb(166,166,166)",
        // Text colors
        text: "rgb(255,255,255)",
        inverseText: "rgb(0,0,0)",
        inactive: "rgb(153,153,153)",
        inactiveShimmer: "rgb(193,193,193)",
        subtle: "rgb(80,80,80)",
        textMuted: "rgb(153,153,153)",
        textDim: "rgb(80,80,80)",
        // Background colors
        background: "rgb(10,10,10)",
        surface: "rgb(30,30,30)",
        userMessageBackground: "rgb(55,55,55)",
        userMessageBackgroundHover: "rgb(70,70,70)",
        // Semantic colors
        success: "rgb(78,186,101)",
        error: "rgb(255,107,128)",
        warning: "rgb(255,193,7)",
        warningShimmer: "rgb(255,223,57)",
        merged: "rgb(175,135,255)",
        // Border colors
        border: "rgb(80,80,80)",
        borderDim: "rgb(50,50,50)",
        // Diff colors
        diffAdded: "rgb(34,92,43)",
        diffRemoved: "rgb(122,41,54)",
        diffAddedDimmed: "rgb(71,88,74)",
        diffRemovedDimmed: "rgb(105,72,77)",
        // Cursor and selection
        cursor: "rgb(215,119,87)",
        selection: "rgb(38,79,120)",
        // System spinner
        claudeBlue: "rgb(147,165,255)",
        claudeBlueShimmer: "rgb(177,195,255)",
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
export const lightTheme = {
    ...defaultTheme,
    colors: {
        ...defaultTheme.colors,
        text: "rgb(0,0,0)",
        inverseText: "rgb(255,255,255)",
        inactive: "rgb(102,102,102)",
        background: "rgb(250,250,250)",
        surface: "rgb(240,240,240)",
        userMessageBackground: "rgb(240,240,240)",
        userMessageBackgroundHover: "rgb(252,252,252)",
        selection: "rgb(180,213,255)",
        border: "rgb(200,200,200)",
        borderDim: "rgb(230,230,230)",
        success: "rgb(44,122,57)",
        error: "rgb(171,43,63)",
        warning: "rgb(150,108,30)",
        claude: "rgb(215,119,87)",
        claudeShimmer: "rgb(245,149,117)",
        textMuted: "rgb(102,102,102)",
        textDim: "rgb(175,175,175)",
    },
};
// Current theme state
let currentTheme = defaultTheme;
// Theme context for React components
export const ThemeContext = createContext([
    currentTheme,
    () => { },
]);
export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(defaultTheme);
    return (React.createElement(ThemeContext.Provider, { value: [theme, setThemeState] }, children));
}
export function useTheme() {
    return useContext(ThemeContext)[0];
}
export function setTheme(theme) {
    currentTheme = theme;
}
export function getTheme() {
    return currentTheme;
}
// Color resolution helper - convert theme key to actual color
export function resolveColor(color, theme) {
    if (color.startsWith("rgb(") || color.startsWith("#")) {
        return color;
    }
    const themeColors = theme.colors;
    return themeColors[color] || color;
}
// Parse RGB string to object
export function parseRGB(color) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
        return {
            r: parseInt(match[1], 10),
            g: parseInt(match[2], 10),
            b: parseInt(match[3], 10),
        };
    }
    return null;
}
// Interpolate between two colors
export function interpolateColor(from, to, intensity) {
    return {
        r: Math.round(from.r + (to.r - from.r) * intensity),
        g: Math.round(from.g + (to.g - from.g) * intensity),
        b: Math.round(from.b + (to.b - from.b) * intensity),
    };
}
// Convert RGB object to CSS string
export function toRGBColor(color) {
    return `rgb(${color.r},${color.g},${color.b})`;
}
// Error red for stalled animation
export const ERROR_RED = { r: 171, g: 43, b: 63 };
// Inactive thinking color
export const THINKING_INACTIVE = { r: 153, g: 153, b: 153 };
export const THINKING_INACTIVE_SHIMMER = { r: 185, g: 185, b: 185 };
