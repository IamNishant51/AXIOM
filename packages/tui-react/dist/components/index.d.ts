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
import React from "react";
/**
 * Divider - Clean visual separator
 */
export declare const Divider: React.FC<{
    char?: string;
    color?: string;
}>;
/**
 * Badge - Small label/tag component
 */
export declare const Badge: React.FC<{
    children: React.ReactNode;
    color?: string;
    variant?: "solid" | "outline";
}>;
/**
 * Progress - Simple progress indicator
 */
export declare const Progress: React.FC<{
    value: number;
    width?: number;
    color?: string;
}>;
/**
 * Cursor - Blinking cursor component
 */
export declare const Cursor: React.FC<{
    color?: string;
}>;
/**
 * Spacer - Flexible space component
 */
export declare const Spacer: React.FC<{
    size?: number;
}>;
/**
 * Flex - Flexbox container for layout
 */
export declare const Flex: React.FC<{
    direction?: "row" | "column";
    align?: "flex-start" | "center" | "flex-end" | "stretch";
    justify?: "flex-start" | "center" | "flex-end" | "space-between";
    children: React.ReactNode;
    gap?: number;
}>;
//# sourceMappingURL=index.d.ts.map