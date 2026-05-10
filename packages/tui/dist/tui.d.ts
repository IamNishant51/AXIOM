/**
 * Core TUI - Terminal User Interface with differential rendering
 * Axiom TUI
 */
import type { Terminal } from "./terminal.js";
/**
 * Component interface
 */
export interface Component {
    render(width: number): string[];
    handleInput?(data: string): void;
    wantsKeyRelease?: boolean;
    invalidate(): void;
}
/**
 * Interface for components that can receive focus
 */
export interface Focusable {
    focused: boolean;
}
/**
 * Cursor position marker
 */
export declare const CURSOR_MARKER = "\u001B_pi:c\u0007";
/**
 * Check if component is focusable
 */
export declare function isFocusable(component: Component | null): component is Component & {
    focused: boolean;
};
/**
 * Overlay anchor positions
 */
export type OverlayAnchor = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center" | "left-center" | "right-center";
/**
 * Overlay margin
 */
export interface OverlayMargin {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
}
/**
 * Size value - absolute or percentage
 */
export type SizeValue = number | `${number}%`;
/**
 * Overlay options
 */
export interface OverlayOptions {
    width?: SizeValue;
    minWidth?: number;
    maxHeight?: SizeValue;
    anchor?: OverlayAnchor;
    offsetX?: number;
    offsetY?: number;
    row?: SizeValue;
    col?: SizeValue;
    margin?: OverlayMargin | number;
    visible?: (termWidth: number, termHeight: number) => boolean;
    nonCapturing?: boolean;
}
/**
 * Overlay handle
 */
export interface OverlayHandle {
    hide(): void;
    setHidden(hidden: boolean): void;
    isHidden(): boolean;
    focus(): void;
    unfocus(): void;
    isFocused(): boolean;
}
/**
 * Container - component that contains other components
 */
export declare class Container implements Component {
    children: Component[];
    addChild(component: Component): void;
    removeChild(component: Component): void;
    clear(): void;
    invalidate(): void;
    render(width: number): string[];
}
/**
 * Main TUI class
 */
export declare class TUI {
    private terminal;
    private children;
    private focusIndex;
    private overlayStack;
    private lastRendered;
    private running;
    private frameCallback?;
    constructor(terminal: Terminal);
    /**
     * Add a child component
     */
    addChild(component: Component): void;
    /**
     * Remove a child component
     */
    removeChild(component: Component): void;
    /**
     * Start the TUI
     */
    start(): void;
    /**
     * Stop the TUI
     */
    stop(): void;
    /**
     * Request a re-render
     */
    requestRender(): void;
    /**
     * Show an overlay
     */
    showOverlay(component: Component, options?: OverlayOptions): OverlayHandle;
    /**
     * Hide topmost overlay
     */
    hideOverlay(): void;
    /**
     * Check if overlay is active
     */
    hasOverlay(): boolean;
    /**
     * Debug callback
     */
    onDebug?: () => void;
    /**
     * Handle input
     */
    private handleInput;
    /**
     * Handle resize
     */
    private handleResize;
    /**
     * Render the UI
     */
    private render;
    /**
     * Build render tree with positions
     */
    private buildRenderTree;
    /**
     * Differential rendering
     */
    private diffRender;
    /**
     * Full render
     */
    private fullRender;
}
/**
 * Export utilities
 */
export { visibleWidth, truncateToWidth, wrapTextWithAnsi } from "./utils.js";
export type { Terminal };
export { ProcessTerminal } from "./terminal.js";
//# sourceMappingURL=tui.d.ts.map