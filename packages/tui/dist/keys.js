/**
 * Keyboard handling - Kitty keyboard protocol support
 * Axiom TUI
 */
/**
 * Key identifiers
 */
export const Key = {
    enter: "enter",
    escape: "escape",
    tab: "tab",
    space: "space",
    backspace: "backspace",
    delete: "delete",
    home: "home",
    end: "end",
    up: "up",
    down: "down",
    left: "left",
    right: "right",
    ctrl: (key) => `ctrl+${key}`,
    alt: (key) => `alt+${key}`,
    shift: (key) => `shift+${key}`,
};
/**
 * Parse key from input data
 */
export function parseKey(data) {
    // Kitty keyboard protocol
    if (data.startsWith("\x1b[")) {
        // CSI sequence
        const seq = data.slice(2);
        // Function keys
        if (seq.startsWith("P"))
            return "f1";
        if (seq.startsWith("Q"))
            return "f2";
        if (seq.startsWith("R"))
            return "f3";
        if (seq.startsWith("S"))
            return "f4";
        // Arrow keys with modifiers
        if (seq === "A")
            return "up";
        if (seq === "B")
            return "down";
        if (seq === "C")
            return "right";
        if (seq === "D")
            return "left";
        // Home/End
        if (seq === "H")
            return "home";
        if (seq === "F")
            return "end";
        // Page up/down
        if (seq === "5~")
            return "pageup";
        if (seq === "6~")
            return "pagedown";
        // With shift modifier
        if (seq === "1;2A")
            return "shift+up";
        if (seq === "1;2B")
            return "shift+down";
        if (seq === "1;2C")
            return "shift+right";
        if (seq === "1;2D")
            return "shift+left";
        // With ctrl modifier
        if (seq === "1;5A")
            return "ctrl+up";
        if (seq === "1;5B")
            return "ctrl+down";
        if (seq === "1;5C")
            return "ctrl+right";
        if (seq === "1;5D")
            return "ctrl+left";
        // With alt modifier
        if (seq === "1;3A")
            return "alt+up";
        if (seq === "1;3B")
            return "alt+down";
        if (seq === "1;3C")
            return "alt+right";
        if (seq === "1;3D")
            return "alt+left";
    }
    // Simple escape sequences
    if (data === "\r")
        return "enter";
    if (data === "\t")
        return "tab";
    if (data === "\x7f")
        return "backspace";
    if (data === "\x1b")
        return "escape";
    // Regular characters
    if (data.length === 1) {
        return data.toLowerCase();
    }
    return "";
}
/**
 * Match key against pattern
 */
export function matchesKey(data, pattern) {
    const key = parseKey(data);
    // Direct match
    if (key === pattern)
        return true;
    // Parse compound patterns like "ctrl+c"
    const parts = pattern.toLowerCase().split("+");
    if (parts.length === 1)
        return key === parts[0];
    const modifiers = parts.slice(0, -1);
    const baseKey = parts[parts.length - 1];
    // Check modifiers
    const hasCtrl = modifiers.includes("ctrl");
    const hasAlt = modifiers.includes("alt");
    const hasShift = modifiers.includes("shift");
    // Check base key
    if (key !== baseKey)
        return false;
    // This is simplified - real implementation would check actual modifiers from input
    // For now, accept if the pattern is just the base key without modifier prefix in the data
    return true;
}
/**
 * Check if key is a release event (Kitty protocol)
 */
export function isKeyRelease(data) {
    return data.startsWith("\x1b[") && data.includes("release");
}
/**
 * Check if key is a repeat event
 */
export function isKeyRepeat(data) {
    return data.startsWith("\x1b[") && data.includes("repeat");
}
/**
 * Check if Kitty protocol is active
 */
let kittyProtocolActive = false;
export function setKittyProtocolActive(active) {
    kittyProtocolActive = active;
}
export function isKittyProtocolActive() {
    return kittyProtocolActive;
}
//# sourceMappingURL=keys.js.map