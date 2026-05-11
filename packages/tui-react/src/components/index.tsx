/**
 * TUI React - Premium Terminal UI Components
 * Export all components and utilities
 */

export { Panel } from "./Panel.js";
export type { PanelProps } from "./Panel.js";

export { SmoothSpinner } from "./SmoothSpinner.js";
export type { SmoothSpinnerProps } from "./SmoothSpinner.js";

export { StreamedText, StaticText } from "./StreamedText.js";
export type { StreamedTextProps } from "./StreamedText.js";

export { StreamedResponse, StaticResponse } from "./StreamedResponse.js";
export type { StreamedResponseProps, StreamChunk } from "./StreamedResponse.js";

export { StatusIndicator } from "./StatusIndicator.js";
export type { StatusIndicatorProps, StatusState } from "./StatusIndicator.js";

export { InputManager } from "./InputManager.js";
export type { InputManagerProps, Command } from "./InputManager.js";

export { InteractiveMenu, useMenuInput } from "./InteractiveMenu.js";
export type { InteractiveMenuProps, MenuItem } from "./InteractiveMenu.js";

// New advanced components
export { StreamingResponse, StreamingThinking } from "./StreamingResponse.js";

export { ToolOutput, ToolChain } from "./ToolOutput.js";

export { DiffView, createSimpleDiff } from "./DiffView.js";
export type { DiffLine, DiffChange, DiffViewProps } from "./DiffView.js";

export { MarkdownRenderer } from "./MarkdownRenderer.js";

// Phase 3 - Interaction & UX
export { TranscriptView } from "./TranscriptView.js";
export type { TranscriptMessage } from "./TranscriptView.js";

export { VimInput } from "./VimInput.js";
export type { VimMode } from "./VimInput.js";

// Phase 4 - Panel & Layout
export { PermissionDialog, PermissionManager } from "./PermissionDialog.js";
export type { PermissionType, PermissionDialogProps } from "./PermissionDialog.js";

export { StatusBar, CompactStatus } from "./StatusBar.js";
export type { StatusBarProps } from "./StatusBar.js";

// Phase 5 - Advanced Features
export { SplitPane, TabContainer } from "./SplitPane.js";
export type { SplitDirection, SplitPaneProps, TabItem, TabContainerProps } from "./SplitPane.js";

export { ScrollBox } from "./ScrollBox.js";
export type { ScrollBoxProps } from "./ScrollBox.js";

export { CopyButton, CopyButtonRow } from "./CopyButton.js";
export type { CopyButtonProps } from "./CopyButton.js";

// Additional utility components
import React from "react";
import { Box, Text } from "ink";
import { useTheme } from "../theme/index.js";

/**
 * Divider - Clean visual separator
 */
export const Divider: React.FC<{ char?: string; color?: string }> = ({
  char = "─",
  color,
}) => {
  const theme = useTheme();
  return (
    <Box width="100%">
      <Text color={color || theme.colors.borderDim}>
        {char.repeat(60)}
      </Text>
    </Box>
  );
};

/**
 * Badge - Small label/tag component
 */
export const Badge: React.FC<{
  children: React.ReactNode;
  color?: string;
  variant?: "solid" | "outline";
}> = ({ children, color, variant = "outline" }) => {
  const theme = useTheme();
  const bgColor = color || theme.colors.primary;

  if (variant === "solid") {
    return (
      <Box>
        <Text bold color={bgColor}>
          {" "}
          {children}{" "}
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text color={bgColor}>[{children}]</Text>
    </Box>
  );
};

/**
 * Progress - Simple progress indicator
 */
export const Progress: React.FC<{
  value: number; // 0-100
  width?: number;
  color?: string;
}> = ({ value, width = 40, color }) => {
  const theme = useTheme();
  const filled = Math.round((value / 100) * width);
  const empty = width - filled;

  return (
    <Box>
      <Text color={color || theme.colors.accent}>
        {"█".repeat(filled)}
      </Text>
      <Text color={theme.colors.borderDim}>
        {"░".repeat(empty)}
      </Text>
      <Text color={theme.colors.textMuted}> {value}%</Text>
    </Box>
  );
};

/**
 * Cursor - Blinking cursor component
 */
export const Cursor: React.FC<{ color?: string }> = ({ color }) => {
  const theme = useTheme();
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const interval = setInterval(() => setVisible((v) => !v), 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <Text color={visible ? color || theme.colors.cursor : "transparent"}>
      █
    </Text>
  );
};

/**
 * Spacer - Flexible space component
 */
export const Spacer: React.FC<{ size?: number }> = ({ size = 1 }) => {
  return <Box height={size} />;
};

/**
 * Flex - Flexbox container for layout
 */
export const Flex: React.FC<{
  direction?: "row" | "column";
  align?: "flex-start" | "center" | "flex-end" | "stretch";
  justify?: "flex-start" | "center" | "flex-end" | "space-between";
  children: React.ReactNode;
  gap?: number;
}> = ({ direction = "row", align, justify, children, gap }) => {
  return (
    <Box flexDirection={direction} alignItems={align} justifyContent={justify}>
      {gap !== undefined && gap > 0 && (
        <>
          {React.Children.map(children, (child, i) => (
            <React.Fragment key={i}>
              {i > 0 && <Box width={gap} />}
              {child}
            </React.Fragment>
          ))}
        </>
      )}
      {gap === undefined && children}
    </Box>
  );
};