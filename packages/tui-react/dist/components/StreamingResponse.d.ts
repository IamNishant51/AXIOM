/**
 * StreamingResponse Component - Real-time streaming text
 * Character-by-character streaming with no layout jitter
 */
import React from "react";
export interface StreamChunk {
    type: "text" | "thinking" | "tool_call" | "tool_result" | "tool_output";
    content: string;
    toolName?: string;
    timestamp?: number;
}
export interface StreamingResponseProps {
    initialContent?: string;
    isStreaming?: boolean;
    onComplete?: () => void;
    showCursor?: boolean;
    style?: "plain" | "markdown" | "code";
}
export declare const StreamingResponse: React.FC<StreamingResponseProps>;
export declare const StreamingThinking: React.FC<{
    thinking: string;
    isStreaming?: boolean;
    isExpanded?: boolean;
}>;
export default StreamingResponse;
//# sourceMappingURL=StreamingResponse.d.ts.map