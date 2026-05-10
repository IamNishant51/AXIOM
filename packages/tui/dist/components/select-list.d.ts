/**
 * SelectList Component - Interactive selection list
 * Axiom TUI
 */
import type { Component } from "../tui.js";
/**
 * Select item
 */
export interface SelectItem {
    value: string;
    label: string;
    description?: string;
}
/**
 * Select list theme
 */
export interface SelectListTheme {
    selectedPrefix: (text: string) => string;
    selectedText: (text: string) => string;
    description: (text: string) => string;
    scrollInfo: (text: string) => string;
    noMatch: (text: string) => string;
}
/**
 * Select list layout options
 */
export interface SelectListLayoutOptions {
    maxWidth?: number;
    align?: "left" | "center" | "right";
}
/**
 * Truncate primary context
 */
export interface SelectListTruncatePrimaryContext {
    text: string;
    width: number;
}
/**
 * Select list component - interactive list for selection
 */
export declare class SelectList implements Component {
    private items;
    private maxVisible;
    private theme;
    private selectedIndex;
    private filter;
    onSelect?: (item: SelectItem) => void;
    onCancel?: () => void;
    onSelectionChange?: (item: SelectItem) => void;
    constructor(items: SelectItem[], maxVisible: number | undefined, theme: SelectListTheme);
    /**
     * Set filter
     */
    setFilter(filter: string): void;
    invalidate(): void;
    render(width: number): string[];
    handleInput(data: string): void;
}
//# sourceMappingURL=select-list.d.ts.map