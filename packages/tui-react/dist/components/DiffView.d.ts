/**
 * DiffView Component - Code change display
 * Shows additions/deletions with proper styling like Claude Code
 */
import React from "react";
export interface DiffLine {
    type: "added" | "removed" | "unchanged" | "header";
    content: string;
    lineNumber?: number;
}
export interface DiffChange {
    type: "added" | "removed" | "unchanged";
    content: string;
    lineNumber?: number;
}
export interface DiffViewProps {
    diff: string | DiffLine[];
    mode?: "inline" | "unified";
    showLineNumbers?: boolean;
    collapsible?: boolean;
    maxHeight?: number;
}
export declare const DiffView: React.FC<DiffViewProps>;
export declare const createSimpleDiff: (oldContent: string, newContent: string) => DiffLine[];
export default DiffView;
//# sourceMappingURL=DiffView.d.ts.map