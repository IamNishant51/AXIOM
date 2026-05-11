/**
 * TranscriptView - Scrollable message history with search
 * Like Claude Code's transcript mode (Ctrl+O)
 */
import React from "react";
export interface TranscriptMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp?: number;
    thinking?: string;
    toolCalls?: Array<{
        name: string;
        args: any;
        result?: string;
    }>;
}
export interface TranscriptViewProps {
    messages: TranscriptMessage[];
    onExit?: () => void;
}
export declare const TranscriptView: React.FC<TranscriptViewProps>;
export default TranscriptView;
//# sourceMappingURL=TranscriptView.d.ts.map