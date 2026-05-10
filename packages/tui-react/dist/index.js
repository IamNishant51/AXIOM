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
// Core components
export { Panel, SmoothSpinner, StreamedText, StaticText, StreamedResponse, StaticResponse as StaticMessage, StatusIndicator, InputManager, InteractiveMenu, useMenuInput, } from "./components/index.js";
// Main App component
export { App, default as AppDefault } from "./App.js";
// Utility components
export { Divider, Badge, Progress, Cursor, Spacer, Flex, } from "./components/index.js";
// Demo app
export { Demo } from "./Demo.js";
export { default } from "./Demo.js";
