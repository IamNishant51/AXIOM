/**
 * Keyboard handling - Kitty keyboard protocol support
 * Axiom TUI
 */
/**
 * Key identifiers
 */
export declare const Key: {
    enter: string;
    escape: string;
    tab: string;
    space: string;
    backspace: string;
    delete: string;
    home: string;
    end: string;
    up: string;
    down: string;
    left: string;
    right: string;
    ctrl: (key: string) => string;
    alt: (key: string) => string;
    shift: (key: string) => string;
};
/**
 * Parse key from input data
 */
export declare function parseKey(data: string): string;
/**
 * Match key against pattern
 */
export declare function matchesKey(data: string, pattern: string): boolean;
/**
 * Check if key is a release event (Kitty protocol)
 */
export declare function isKeyRelease(data: string): boolean;
/**
 * Check if key is a repeat event
 */
export declare function isKeyRepeat(data: string): boolean;
export declare function setKittyProtocolActive(active: boolean): void;
export declare function isKittyProtocolActive(): boolean;
//# sourceMappingURL=keys.d.ts.map