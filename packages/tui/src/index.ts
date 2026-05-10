/**
 * Axiom TUI - Terminal UI Framework
 * Main exports
 */

// Core
export { TUI, Container, CURSOR_MARKER, isFocusable } from "./tui.js";
export type { Component, Focusable, OverlayAnchor, OverlayHandle, OverlayMargin, OverlayOptions, SizeValue } from "./tui.js";

// Terminal
export { ProcessTerminal } from "./terminal.js";
export type { Terminal } from "./terminal.js";

// Keyboard
export { Key, matchesKey, parseKey, isKeyRelease, isKeyRepeat, setKittyProtocolActive, isKittyProtocolActive } from "./keys.js";

// Components
export { Box } from "./components/box.js";
export { Editor, type EditorTheme, type EditorOptions, type AutocompleteItem, type AutocompleteProvider } from "./components/editor.js";
export { Loader, CancellableLoader } from "./components/loader.js";
export { SelectList, type SelectItem, type SelectListTheme } from "./components/select-list.js";
export { Spacer } from "./components/spacer.js";
export { Text } from "./components/text.js";

// Utilities
export { truncateToWidth, visibleWidth, wrapTextWithAnsi } from "./utils.js";