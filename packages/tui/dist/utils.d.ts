/**
 * Utility functions for TUI
 * Axiom TUI
 */
/**
 * Calculate visible width of string (ignoring ANSI codes)
 */
export declare function visibleWidth(str: string): number;
/**
 * Truncate string to specified width, preserving ANSI codes
 */
export declare function truncateToWidth(str: string, width: number, ellipsis?: string): string;
/**
 * Wrap text to specified width, preserving ANSI codes
 */
export declare function wrapTextWithAnsi(text: string, width: number): string[];
/**
 * Extract text segments (text and escape codes)
 */
export declare function extractSegments(text: string): Array<{
    text: string;
    escape?: string;
}>;
/**
 * Slice text by column position
 */
export declare function sliceByColumn(text: string, start: number, end: number): string;
/**
 * Slice text by visible width
 */
export declare function sliceWithWidth(text: string, start: number, end: number): string;
//# sourceMappingURL=utils.d.ts.map