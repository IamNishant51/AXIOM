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
export declare const defaultTheme: Theme;
export declare const lightTheme: Theme;
export declare function setTheme(theme: Theme): void;
export declare function getTheme(): Theme;
export declare function useTheme(): Theme;
//# sourceMappingURL=index.d.ts.map