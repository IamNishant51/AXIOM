/**
 * Theme System - Axiom Branding Theme
 * Black, Deep Gray, White/Silver color scheme
 */
import React, { type ReactNode } from "react";
export interface ThemeColors {
    primary: string;
    primaryShimmer: string;
    accent: string;
    accentShimmer: string;
    claude: string;
    claudeShimmer: string;
    secondary: string;
    permission: string;
    permissionShimmer: string;
    planMode: string;
    ide: string;
    promptBorder: string;
    promptBorderShimmer: string;
    text: string;
    inverseText: string;
    inactive: string;
    inactiveShimmer: string;
    subtle: string;
    textMuted: string;
    textDim: string;
    background: string;
    surface: string;
    userMessageBackground: string;
    userMessageBackgroundHover: string;
    success: string;
    error: string;
    warning: string;
    warningShimmer: string;
    merged: string;
    border: string;
    borderDim: string;
    diffAdded: string;
    diffRemoved: string;
    diffAddedDimmed: string;
    diffRemovedDimmed: string;
    cursor: string;
    selection: string;
    spinner: string;
    spinnerShimmer: string;
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
export declare const axiomDarkTheme: Theme;
export declare const axiomLightTheme: Theme;
export declare const defaultTheme: Theme;
export declare const lightTheme: Theme;
export declare const ThemeContext: React.Context<[Theme, (theme: Theme) => void]>;
export declare function ThemeProvider({ children }: {
    children: ReactNode;
}): React.JSX.Element;
export declare function useTheme(): Theme;
export declare function setTheme(theme: Theme): void;
export declare function getTheme(): Theme;
export declare function resolveColor(color: string, theme: Theme): string;
export declare function parseRGB(color: string): {
    r: number;
    g: number;
    b: number;
} | null;
export declare function interpolateColor(from: {
    r: number;
    g: number;
    b: number;
}, to: {
    r: number;
    g: number;
    b: number;
}, intensity: number): {
    r: number;
    g: number;
    b: number;
};
export declare function toRGBColor(color: {
    r: number;
    g: number;
    b: number;
}): string;
export declare const ERROR_RED: {
    r: number;
    g: number;
    b: number;
};
export declare const THINKING_INACTIVE: {
    r: number;
    g: number;
    b: number;
};
export declare const THINKING_INACTIVE_SHIMMER: {
    r: number;
    g: number;
    b: number;
};
export declare const AXIOM_CAT_LOGO = "\n                                                               .#@@%:\n                                #@@#:                         :@*. #@%-\n                                #@@@@@%=.                    :@*    =@@%:\n                                *@:+@*:*@%=                 :@# :#   -@@@*\n                                :@= :%#  :#@#:              %@:.#-    :%*%%:\n                                 @#   %@:   +@%:           +@= =*      .@==@*\n                                 +%:   %%:    =@%:        :%% .%-       :%:-@#\n                                 .@*    ##.     +@%:     .+@: +*         ** :@#.\n                                  ##.   .%*..:-+*@@@@%%%%@@+  %=         :%- :@#\n                                  -@-   :#@@@#*-:.       *%: =#.          #+  -@*\n                                   %#*%@*-.              #=  %+           **   +@:\n                                  *@@+                       +@%=         **   .%*\n                               -%@*                             :*@#:     **    =@-\n                             :%@=                                  .*@=   %=    :@@-\n                            *@+                                       +%++%:    :%@@*\n                          -@#:                                          =%=     :@+-@*\n                         -@*                                                    -@- =@=\n                        :@*                                                      :   *%:\n              .+#%%#*+-:%*      .-+*##%%%%%%#*+-.                                    :@*\n             :@@+---=+*%@+   .*@#*+=-:::::::-=+#@@%=-::::::::::::::::::::::::.        *@.\n             -@*=#####*#@@+::*@:      :+*+-:    +@@#************************#@@*.     -@-\n             :%*      *#=@%*%@#.    -%+#@+:*@#- =@*                           :%@:    :%*\n              *%      %*-@=  *@:   .#= +@=  -@= +@+                            .%#     #%\n              +@:     +@#@:  -@=   -@%  %= *@:  *@:                                    *@\n              -@*      @@=   .#%.  ***@%#%%=    #@                                     *@\n               *@=    +@=     -@*              :%#                                    .#%\n                =@@#*%@-       +@#:           :#@:                                    :%*\n                  .=@%.         .*%@@@@@@@@@@@@*.                                     +@:\n                  .#@@@@@@%=                                                         .#%\n                  .#@-  =#@*                                                         =@=\n                  .#@@**@-                                                          .@*\n                  .#*-@@*                                                           #%:\n                   +@: %#.                                                         #%:\n                    *@::@%*                                                      :%%.\n                     -@@%=*@@#+:    ::                                          *@*\n                       :@+   :+#@@@@%*                                       :%@%@*\n                        -@#.                                              -%@%-  +@-\n                          +%@*=:..                                   :=#@%*:      #@\n                            .-+*#%@@@@%#*:                      :=*@@#+:        :#@*\n                                   :##=:=%*       :*##-   .-*#@@#+:.         :*@#-\n                                  .%*:%@*:#%   -%@@-.*@%@@@*:             *%@%:\n                                  -@:   *@@@@@@%:    :%*             .+@@@*.\n                                  +%:   *%: :@*      .#@        .=%@@%+.\n                                  =@:   *%: :@*      .#@..:=*%@%*=:\n                                  :@+   +@%**@%:     :%@@#*=:\n                                   *@*#@*:::::=@%+.  -@=\n                                    ::          .*@@%@%\n                                                    .:";
export declare const AXIOM_CAT_COMPACT = "\n   /\\_/\\\n  ( o.o )\n   > ^ <";
//# sourceMappingURL=index.d.ts.map