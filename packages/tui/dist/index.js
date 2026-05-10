/**
 * Axiom TUI - Terminal UI Framework
 * Main exports
 */
// Core
export { TUI, Container, CURSOR_MARKER, isFocusable } from "./tui.js";
// Terminal
export { ProcessTerminal } from "./terminal.js";
// Keyboard
export { Key, matchesKey, parseKey, isKeyRelease, isKeyRepeat, setKittyProtocolActive, isKittyProtocolActive } from "./keys.js";
// Components
export { Box } from "./components/box.js";
export { Editor } from "./components/editor.js";
export { Loader, CancellableLoader } from "./components/loader.js";
export { SelectList } from "./components/select-list.js";
export { Spacer } from "./components/spacer.js";
export { Text } from "./components/text.js";
// Utilities
export { truncateToWidth, visibleWidth, wrapTextWithAnsi } from "./utils.js";
//# sourceMappingURL=index.js.map