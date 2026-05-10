/**
 * Text Component - Multi-line text display with word wrapping
 * Axiom TUI
 */
import type { Component } from "../tui.js";
/**
 * Text component options
 */
export interface TextOptions {
    paddingX?: number;
    paddingY?: number;
    backgroundFn?: (text: string) => string;
}
/**
 * Text component - displays multi-line text with word wrapping
 */
export declare class Text implements Component {
    private text;
    private paddingX;
    private paddingY;
    private backgroundFn?;
    private cachedLines?;
    constructor(text: string, options?: TextOptions);
    /**
     * Set text content
     */
    setText(text: string): void;
    /**
     * Set background function
     */
    setBackgroundFn(fn: (text: string) => string): void;
    invalidate(): void;
    render(width: number): string[];
    /**
     * Word wrap text to fit width
     */
    private wrapText;
}
//# sourceMappingURL=text.d.ts.map