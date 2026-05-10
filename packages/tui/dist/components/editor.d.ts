/**
 * Editor Component - Multi-line text editor with autocomplete
 * Axiom TUI
 */
import type { Component, Focusable } from "../tui.js";
import type { Terminal } from "../terminal.js";
/**
 * Editor theme
 */
export interface EditorTheme {
    borderColor: (str: string) => string;
    selectList?: SelectListTheme;
}
/**
 * Select list theme (for autocomplete)
 */
export interface SelectListTheme {
    selectedPrefix: (text: string) => string;
    selectedText: (text: string) => string;
    description: (text: string) => string;
    scrollInfo: (text: string) => string;
    noMatch: (text: string) => string;
}
/**
 * Editor options
 */
export interface EditorOptions {
    paddingX?: number;
}
/**
 * Autocomplete item
 */
export interface AutocompleteItem {
    value: string;
    label: string;
    description?: string;
}
/**
 * Autocomplete provider interface
 */
export interface AutocompleteProvider {
    getSuggestions(input: string): AutocompleteItem[];
}
/**
 * Editor component - interactive multi-line text editor
 */
export declare class Editor implements Component, Focusable {
    private text;
    private cursorX;
    private cursorY;
    private scrollY;
    private _focused;
    private terminal?;
    private theme;
    private options;
    private autocompleteProvider?;
    private showAutocomplete;
    private autocompleteItems;
    private autocompleteIndex;
    onSubmit?: (text: string) => void;
    onChange?: (text: string) => void;
    constructor(theme: EditorTheme, options?: EditorOptions);
    /**
     * Initialize with terminal for height awareness
     */
    setTerminal(terminal: Terminal): void;
    /**
     * Set autocomplete provider
     */
    setAutocompleteProvider(provider: AutocompleteProvider): void;
    /**
     * Set editor content
     */
    setValue(text: string): void;
    /**
     * Get editor content
     */
    getValue(): string;
    /**
     * Clear editor
     */
    clear(): void;
    /**
     * Enable/disable submit
     */
    disableSubmit: boolean;
    invalidate(): void;
    render(width: number): string[];
    /**
     * Render autocomplete suggestions
     */
    private renderAutocomplete;
    handleInput(data: string): void;
    /**
     * Insert text at cursor
     */
    private insertText;
    /**
     * Handle backspace
     */
    private handleBackspace;
    /**
     * Delete to end of line
     */
    private deleteToEndOfLine;
    /**
     * Delete word backward
     */
    private deleteWordBackward;
    /**
     * Clamp cursor to valid position
     */
    private clampCursor;
    /**
     * Update autocomplete suggestions
     */
    private updateAutocomplete;
    /**
     * Insert autocomplete item
     */
    private insertAutocompleteItem;
    get focused(): boolean;
    set focused(value: boolean);
}
//# sourceMappingURL=editor.d.ts.map