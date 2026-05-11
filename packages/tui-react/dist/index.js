/**
 * @axiom/tui-react - Premium Terminal UI Components
 *
 * A collection of minimalist, premium terminal UI components
 * built with React and Ink for Node.js applications.
 *
 * Usage:
 *   import { Panel, SmoothSpinner, StreamedText } from '@axiom/tui-react';
 */
// Theme system
export { defaultTheme, lightTheme, setTheme, getTheme, useTheme, } from "./theme/index.js";
// Theme loading
export { loadTheme, saveTheme, listThemes, createDefaultTheme, mergeTheme, } from "./theme/loadTheme.js";
// Core components
export { Panel, SmoothSpinner, StreamedText, StaticText, StreamedResponse, StreamingResponse, StreamingThinking, StaticResponse as StaticMessage, StatusIndicator, InputManager, InteractiveMenu, useMenuInput, } from "./components/index.js";
// New advanced components
export { DiffView, ToolOutput, ToolChain, MarkdownRenderer, createSimpleDiff, } from "./components/index.js";
// Phase 3 - Interaction & UX
export { TranscriptView, VimInput, } from "./components/index.js";
// Phase 4 - Panel & Layout
export { PermissionDialog, PermissionManager, StatusBar, CompactStatus, } from "./components/index.js";
// Phase 5 - Advanced Features
export { SplitPane, TabContainer, } from "./components/index.js";
// Hooks
export { useStreaming, useScrollback, } from "./hooks/index.js";
// Main App component
export { App, default as AppDefault } from "./App.js";
// Utility components
export { Divider, Badge, Progress, Cursor, Spacer, Flex, } from "./components/index.js";
// Demo app
export { Demo } from "./Demo.js";
export { default } from "./Demo.js";
