/**
 * @axiom/tui-react - Premium Terminal UI Components
 *
 * A collection of minimalist, premium terminal UI components
 * built with React and Ink for Node.js applications.
 *
 * Usage:
 *   import { Panel, SmoothSpinner, StreamedText } from '@axiom/tui-react';
 */
export { defaultTheme, lightTheme, setTheme, getTheme, useTheme, type Theme, type ThemeColors, type ThemeBorders, } from "./theme/index.js";
export { Panel, SmoothSpinner, StreamedText, StaticText, StreamedResponse, StaticResponse as StaticMessage, StatusIndicator, InputManager, InteractiveMenu, useMenuInput, type PanelProps, type SmoothSpinnerProps, type StreamedTextProps, type StreamedResponseProps, type StreamChunk, type StatusIndicatorProps, type StatusState, type InputManagerProps, type Command, type InteractiveMenuProps, type MenuItem, } from "./components/index.js";
export { App, default as AppDefault } from "./App.js";
export type { AppProps, Message } from "./App.js";
export { Divider, Badge, Progress, Cursor, Spacer, Flex, } from "./components/index.js";
export { Demo } from "./Demo.js";
export { default } from "./Demo.js";
//# sourceMappingURL=index.d.ts.map