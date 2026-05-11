/**
 * Theme Loading - Load themes from file system
 * Supports ~/.axiom/theme.json
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
// Get theme directory path
function getThemeDir() {
    return path.join(os.homedir(), ".axiom");
}
// Get theme file path
function getThemePath(name) {
    const themeDir = getThemeDir();
    if (name) {
        return path.join(themeDir, `${name}.json`);
    }
    return path.join(themeDir, "theme.json");
}
// Load theme from file
export function loadTheme(name) {
    const themePath = getThemePath(name);
    try {
        if (!fs.existsSync(themePath)) {
            return null;
        }
        const content = fs.readFileSync(themePath, "utf-8");
        const theme = JSON.parse(content);
        return theme;
    }
    catch (error) {
        console.error(`Failed to load theme from ${themePath}:`, error);
        return null;
    }
}
// Save theme to file
export function saveTheme(name, theme) {
    const themeDir = getThemeDir();
    const themePath = getThemePath(name);
    try {
        // Ensure directory exists
        if (!fs.existsSync(themeDir)) {
            fs.mkdirSync(themeDir, { recursive: true });
        }
        fs.writeFileSync(themePath, JSON.stringify(theme, null, 2), "utf-8");
        return true;
    }
    catch (error) {
        console.error(`Failed to save theme to ${themePath}:`, error);
        return false;
    }
}
// List available themes
export function listThemes() {
    const themeDir = getThemeDir();
    try {
        if (!fs.existsSync(themeDir)) {
            return [];
        }
        const files = fs.readdirSync(themeDir);
        return files
            .filter((f) => f.endsWith(".json"))
            .map((f) => f.replace(".json", ""));
    }
    catch (error) {
        return [];
    }
}
// Create default theme file
export function createDefaultTheme() {
    const themePath = getThemePath();
    if (fs.existsSync(themePath)) {
        return false; // Don't overwrite existing
    }
    const defaultTheme = {
        name: "default",
        colors: {
            primary: "#60A5FA",
            secondary: "#A78BFA",
            accent: "#34D399",
            background: "#0D0D0D",
            surface: "#171717",
            text: "#F5F5F5",
            textDim: "#A3A3A3",
            textMuted: "#525252",
            border: "#404040",
            borderDim: "#262626",
            success: "#4ADE80",
            error: "#F87171",
            warning: "#FBBF24",
            cursor: "#60A5FA",
            selection: "#374151",
            // Extended
            claude: "#60A5FA",
            inactive: "#525252",
            subtle: "#262626",
            suggestion: "#A78BFA",
            permission: "#FBBF24",
            diffAdded: "#4ADE80",
            diffRemoved: "#F87171",
        },
        typography: {
            cursor: "❯",
            bullet: "•",
            spinner: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
        },
    };
    return saveTheme("theme", defaultTheme);
}
// Merge loaded theme with default
export function mergeTheme(loaded, defaultTheme) {
    if (!loaded)
        return defaultTheme;
    return {
        ...defaultTheme,
        colors: {
            ...defaultTheme.colors,
            ...loaded.colors,
        },
        typography: {
            ...defaultTheme.typography,
            ...loaded.typography,
        },
    };
}
export default {
    loadTheme,
    saveTheme,
    listThemes,
    createDefaultTheme,
    mergeTheme,
};
