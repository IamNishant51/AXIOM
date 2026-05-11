/**
 * @axiom/tui-react - Premium Terminal UI Components
 *
 * A collection of minimalist, premium terminal UI components
 * built with React and Ink for Node.js applications.
 *
 * Usage:
 *   import { Panel, SmoothSpinner, StreamedText } from '@axiom/tui-react';
 */
export { defaultTheme, lightTheme, axiomDarkTheme, axiomLightTheme, setTheme, getTheme, useTheme, resolveColor, parseRGB, interpolateColor, toRGBColor, ERROR_RED, THINKING_INACTIVE, THINKING_INACTIVE_SHIMMER, AXIOM_CAT_LOGO, AXIOM_CAT_COMPACT, type Theme, type ThemeColors, type ThemeBorders, } from "./theme/index.js";
export { loadTheme, saveTheme, listThemes, createDefaultTheme, mergeTheme, } from "./theme/loadTheme.js";
export { Panel, SmoothSpinner, StreamedText, StaticText, StreamedResponse, StreamingResponse, StreamingThinking, StaticResponse as StaticMessage, StatusIndicator, InputManager, InteractiveMenu, useMenuInput, type PanelProps, type SmoothSpinnerProps, type StreamedTextProps, type StreamedResponseProps, type StreamChunk, type StatusIndicatorProps, type StatusState, type InputManagerProps, type Command, type InteractiveMenuProps, type MenuItem, } from "./components/index.js";
export { DiffView, ToolOutput, ToolChain, MarkdownRenderer, EnhancedSpinnerRow, GlimmerMessage, createSimpleDiff, type DiffLine, type DiffChange, type DiffViewProps, } from "./components/index.js";
export { TranscriptView, VimInput, type VimMode, } from "./components/index.js";
export { PermissionDialog, PermissionManager, StatusBar, CompactStatus, type PermissionType, type PermissionDialogProps, type StatusBarProps, } from "./components/index.js";
export { SplitPane, TabContainer, type SplitDirection, type SplitPaneProps, type TabItem, type TabContainerProps, } from "./components/index.js";
export { useStreaming, useScrollback, } from "./hooks/index.js";
export { App, default as AppDefault } from "./App.js";
export { Message } from "./App.js";
export { Divider, Badge, Progress, Cursor, Spacer, Flex, } from "./components/index.js";
export { Demo } from "./Demo.js";
export { default } from "./Demo.js";
//# sourceMappingURL=index.d.ts.map