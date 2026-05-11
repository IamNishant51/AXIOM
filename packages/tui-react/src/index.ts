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
export {
  defaultTheme,
  lightTheme,
  setTheme,
  getTheme,
  useTheme,
  type Theme,
  type ThemeColors,
  type ThemeBorders,
} from "./theme/index.js";

// Theme loading
export {
  loadTheme,
  saveTheme,
  listThemes,
  createDefaultTheme,
  mergeTheme,
} from "./theme/loadTheme.js";

// Core components
export {
  Panel,
  SmoothSpinner,
  StreamedText,
  StaticText,
  StreamedResponse,
  StreamingResponse,
  StreamingThinking,
  StaticResponse as StaticMessage,
  StatusIndicator,
  InputManager,
  InteractiveMenu,
  useMenuInput,
  type PanelProps,
  type SmoothSpinnerProps,
  type StreamedTextProps,
  type StreamedResponseProps,
  type StreamChunk,
  type StatusIndicatorProps,
  type StatusState,
  type InputManagerProps,
  type Command,
  type InteractiveMenuProps,
  type MenuItem,
} from "./components/index.js";

// New advanced components
export {
  DiffView,
  ToolOutput,
  ToolChain,
  MarkdownRenderer,
  createSimpleDiff,
  type DiffLine,
  type DiffChange,
  type DiffViewProps,
} from "./components/index.js";

// Phase 3 - Interaction & UX
export {
  TranscriptView,
  VimInput,
  type VimMode,
} from "./components/index.js";

// Phase 4 - Panel & Layout
export {
  PermissionDialog,
  PermissionManager,
  StatusBar,
  CompactStatus,
  type PermissionType,
  type PermissionDialogProps,
  type StatusBarProps,
} from "./components/index.js";

// Phase 5 - Advanced Features
export {
  SplitPane,
  TabContainer,
  type SplitDirection,
  type SplitPaneProps,
  type TabItem,
  type TabContainerProps,
} from "./components/index.js";

// Hooks
export {
  useStreaming,
  useScrollback,
} from "./hooks/index.js";

// Main App component
export { App, default as AppDefault } from "./App.js";
export { Message } from "./App.js";

// Utility components
export {
  Divider,
  Badge,
  Progress,
  Cursor,
  Spacer,
  Flex,
} from "./components/index.js";

// Demo app
export { Demo } from "./Demo.js";
export { default } from "./Demo.js";