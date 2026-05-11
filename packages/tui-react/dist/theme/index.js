/**
 * Theme System - Axiom Branding Theme
 * Black, Deep Gray, White/Silver color scheme
 */
import React, { createContext, useContext, useState } from "react";
// Axiom Dark Theme - Black, Deep Grays, White/Silver
export const axiomDarkTheme = {
    colors: {
        // Primary brand (Axiom purple/violet)
        primary: "rgb(139,92,246)", // violet-500
        primaryShimmer: "rgb(167,139,250)", // violet-400
        accent: "rgb(99,102,241)", // indigo-500
        accentShimmer: "rgb(129,140,248)", // indigo-400
        // Legacy aliases for backward compatibility
        claude: "rgb(139,92,246)",
        claudeShimmer: "rgb(167,139,250)",
        secondary: "rgb(139,92,246)",
        // UI colors
        permission: "rgb(99,102,241)",
        permissionShimmer: "rgb(129,140,248)",
        planMode: "rgb(34,197,94)",
        ide: "rgb(59,130,246)",
        promptBorder: "rgb(75,75,75)",
        promptBorderShimmer: "rgb(100,100,100)",
        // Text colors - High contrast
        text: "rgb(248,248,248)", // Bright white
        inverseText: "rgb(0,0,0)",
        inactive: "rgb(130,130,130)", // Medium gray
        inactiveShimmer: "rgb(170,170,170)",
        subtle: "rgb(100,100,100)", // Dark gray
        textMuted: "rgb(140,140,140)",
        textDim: "rgb(90,90,90)", // Dim gray
        // Background colors - Deep blacks/grays
        background: "rgb(10,10,12)", // Near black
        surface: "rgb(30,30,32)", // Dark gray
        userMessageBackground: "rgb(45,45,50)",
        userMessageBackgroundHover: "rgb(55,55,60)",
        // Semantic colors
        success: "rgb(34,197,94)", // Green
        error: "rgb(248,113,113)", // Red
        warning: "rgb(251,191,36)", // Yellow
        warningShimmer: "rgb(252,211,77)",
        merged: "rgb(167,139,250)", // Purple
        // Border colors
        border: "rgb(60,60,65)",
        borderDim: "rgb(40,40,45)",
        // Diff colors
        diffAdded: "rgb(34,197,94)",
        diffRemoved: "rgb(248,113,113)",
        diffAddedDimmed: "rgb(34,100,60)",
        diffRemovedDimmed: "rgb(150,60,60)",
        // Cursor and selection
        cursor: "rgb(139,92,246)", // Primary violet
        selection: "rgb(99,102,241)", // Indigo
        // System spinner
        spinner: "rgb(139,92,246)",
        spinnerShimmer: "rgb(167,139,250)",
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
// Axiom Light Theme - White, Light Grays
export const axiomLightTheme = {
    ...axiomDarkTheme,
    colors: {
        ...axiomDarkTheme.colors,
        // Primary - slightly lighter
        primary: "rgb(124,58,237)",
        primaryShimmer: "rgb(139,92,246)",
        accent: "rgb(79,70,229)",
        accentShimmer: "rgb(99,102,241)",
        // Legacy aliases
        claude: "rgb(124,58,237)",
        claudeShimmer: "rgb(139,92,246)",
        secondary: "rgb(124,58,237)",
        // Text colors - Dark on light
        text: "rgb(15,15,15)",
        inverseText: "rgb(255,255,255)",
        inactive: "rgb(100,100,100)",
        inactiveShimmer: "rgb(130,130,130)",
        subtle: "rgb(150,150,150)",
        textMuted: "rgb(80,80,80)",
        textDim: "rgb(140,140,140)",
        // Background colors - Light
        background: "rgb(250,250,252)",
        surface: "rgb(240,240,245)",
        userMessageBackground: "rgb(230,230,235)",
        userMessageBackgroundHover: "rgb(220,220,225)",
        // Border colors
        border: "rgb(200,200,205)",
        borderDim: "rgb(220,220,225)",
        // Diff colors - softer on light
        diffAdded: "rgb(22,101,52)",
        diffRemoved: "rgb(153,27,27)",
        diffAddedDimmed: "rgb(220,238,225)",
        diffRemovedDimmed: "rgb(238,220,220)",
        // Selection
        selection: "rgb(180,180,255)",
    },
};
// Default theme is dark
export const defaultTheme = axiomDarkTheme;
// Alias for compatibility
export const lightTheme = axiomLightTheme;
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
// Color resolution helper
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
export const ERROR_RED = { r: 248, g: 113, b: 113 };
// Inactive thinking color
export const THINKING_INACTIVE = { r: 130, g: 130, b: 130 };
export const THINKING_INACTIVE_SHIMMER = { r: 170, g: 170, b: 170 };
// Axiom Cat ASCII Logo (from PLAN.md)
export const AXIOM_CAT_LOGO = `
                                                               .#@@%:
                                #@@#:                         :@*. #@%-
                                #@@@@@%=.                    :@*    =@@%:
                                *@:+@*:*@%=                 :@# :#   -@@@*
                                :@= :%#  :#@#:              %@:.#-    :%*%%:
                                 @#   %@:   +@%:           +@= =*      .@==@*
                                 +%:   %%:    =@%:        :%% .%-       :%:-@#
                                 .@*    ##.     +@%:     .+@: +*         ** :@#.
                                  ##.   .%*..:-+*@@@@%%%%@@+  %=         :%- :@#
                                  -@-   :#@@@#*-:.       *%: =#.          #+  -@*
                                   %#*%@*-.              #=  %+           **   +@:
                                  *@@+                       +@%=         **   .%*
                               -%@*                             :*@#:     **    =@-
                             :%@=                                  .*@=   %=    :@@-
                            *@+                                       +%++%:    :%@@*
                          -@#:                                          =%=     :@+-@*
                         -@*                                                    -@- =@=
                        :@*                                                      :   *%:
              .+#%%#*+-:%*      .-+*##%%%%%%#*+-.                                    :@*
             :@@+---=+*%@+   .*@#*+=-:::::::-=+#@@%=-::::::::::::::::::::::::.        *@.
             -@*=#####*#@@+::*@:      :+*+-:    +@@#************************#@@*.     -@-
             :%*      *#=@%*%@#.    -%+#@+:*@#- =@*                           :%@:    :%*
              *%      %*-@=  *@:   .#= +@=  -@= +@+                            .%#     #%
              +@:     +@#@:  -@=   -@%  %= *@:  *@:                                    *@
              -@*      @@=   .#%.  ***@%#%%=    #@                                     *@
               *@=    +@=     -@*              :%#                                    .#%
                =@@#*%@-       +@#:           :#@:                                    :%*
                  .=@%.         .*%@@@@@@@@@@@@*.                                     +@:
                  .#@@@@@@%=                                                         .#%
                  .#@-  =#@*                                                         =@=
                  .#@@**@-                                                          .@*
                  .#*-@@*                                                           #%:
                   +@: %#.                                                         #%:
                    *@::@%*                                                      :%%.
                     -@@%=*@@#+:    ::                                          *@*
                       :@+   :+#@@@@%*                                       :%@%@*
                        -@#.                                              -%@%-  +@-
                          +%@*=:..                                   :=#@%*:      #@
                            .-+*#%@@@@%#*:                      :=*@@#+:        :#@*
                                   :##=:=%*       :*##-   .-*#@@#+:.         :*@#-
                                  .%*:%@*:#%   -%@@-.*@%@@@*:             *%@%:
                                  -@:   *@@@@@@%:    :%*             .+@@@*.
                                  +%:   *%: :@*      .#@        .=%@@%+.
                                  =@:   *%: :@*      .#@..:=*%@%*=:
                                  :@+   +@%**@%:     :%@@#*=:
                                   *@*#@*:::::=@%+.  -@=
                                    ::          .*@@%@%
                                                    .:`;
// Compact version for welcome screen
export const AXIOM_CAT_COMPACT = `
   /\\_/\\
  ( o.o )
   > ^ <`;
