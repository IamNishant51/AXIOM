/**
 * StreamedResponse Component - Anti-jitter streaming output
 * Efficiently batches updates and renders content
 */
import React from "react";
export interface StreamChunk {
    type: "text" | "thinking" | "tool_call" | "tool_result";
    content: string;
    toolName?: string;
    timestamp?: number;
}
export interface StreamedResponseProps {
    chunks: StreamChunk[];
    isStreaming?: boolean;
    showThinking?: boolean;
    showToolCalls?: boolean;
    onComplete?: () => void;
}
export declare const StreamedResponse: React.FC<StreamedResponseProps>;
export declare const StaticResponse: React.FC<{
    children: React.ReactNode;
}>;
export default StreamedResponse;
//# sourceMappingURL=StreamedResponse.d.ts.map