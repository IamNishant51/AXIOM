/**
 * Clipboard - Terminal clipboard operations
 * Supports both Unix (xclip/pbcopy) and basic copy detection
 */
export interface ClipboardResult {
    success: boolean;
    content?: string;
    error?: string;
}
/**
 * Copy text to clipboard
 */
export declare function copyToClipboard(text: string): Promise<ClipboardResult>;
/**
 * Read from clipboard
 */
export declare function readFromClipboard(): Promise<ClipboardResult>;
/**
 * Check if clipboard tools are available
 */
export declare function isClipboardAvailable(): boolean;
/**
 * Copy to selection clipboard (Linux primary selection)
 */
export declare function copyToSelection(text: string): Promise<ClipboardResult>;
//# sourceMappingURL=clipboard.d.ts.map