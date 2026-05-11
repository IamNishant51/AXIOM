/**
 * MarkdownRenderer - Enhanced markdown rendering for Claude Code style
 * Full GFM support including tables, code blocks, task lists
 */
import React from "react";
interface MarkdownProps {
    content: string;
    style?: "default" | "compact" | "code";
}
/**
 * Main MarkdownRenderer component
 */
export declare const MarkdownRenderer: React.FC<MarkdownProps>;
export default MarkdownRenderer;
//# sourceMappingURL=MarkdownRenderer.d.ts.map