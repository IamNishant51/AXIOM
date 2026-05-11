/**
 * Theme Loading - Load themes from file system
 * Supports ~/.axiom/theme.json
 */
export interface ThemeConfig {
    name?: string;
    colors?: Partial<ThemeColors>;
    typography?: Partial<ThemeTypography>;
}
interface ThemeColors {
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
    claude?: string;
    inactive?: string;
    subtle?: string;
    suggestion?: string;
    permission?: string;
    userMessageBackground?: string;
    assistantMessageBackground?: string;
    diffAdded?: string;
    diffRemoved?: string;
}
interface ThemeTypography {
    cursor: string;
    bullet: string;
    spinner: string[];
}
export declare function loadTheme(name?: string): ThemeConfig | null;
export declare function saveTheme(name: string, theme: ThemeConfig): boolean;
export declare function listThemes(): string[];
export declare function createDefaultTheme(): boolean;
export declare function mergeTheme(loaded: ThemeConfig, defaultTheme: any): any;
declare const _default: {
    loadTheme: typeof loadTheme;
    saveTheme: typeof saveTheme;
    listThemes: typeof listThemes;
    createDefaultTheme: typeof createDefaultTheme;
    mergeTheme: typeof mergeTheme;
};
export default _default;
//# sourceMappingURL=loadTheme.d.ts.map