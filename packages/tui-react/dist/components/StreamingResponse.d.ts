/**
 * StreamingResponse Component - Enhanced with OpenClaude-style animations
 * Real-time streaming text with glimmer effect, stalled detection, and token counter
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
    showGlimmer?: boolean;
    showStalledIndicator?: boolean;
    stalledIntensity?: number;
}
export declare const GlimmerMessage: React.NamedExoticComponent<{
    message: string;
    messageColor: string;
    shimmerColor: string;
    glimmerIndex: number;
    stalledIntensity: number;
}>;
export declare const StreamingResponse: React.FC<StreamingResponseProps>;
export declare const StreamingThinking: React.FC<{
    thinking: string;
    isStreaming?: boolean;
    isExpanded?: boolean;
    showShimmer?: boolean;
    thinkingIntensity?: number;
}>;
export declare const EnhancedSpinnerRow: React.FC<{
    message: string;
    mode: "thinking" | "requesting" | "tool-use" | "responding" | "tool-input";
    isStreaming?: boolean;
    tokens?: number;
    elapsed?: string;
    thinkingText?: string;
    thinkingIntensity?: number;
    stalledIntensity?: number;
    reducedMotion?: boolean;
}>;
export default StreamingResponse;
//# sourceMappingURL=StreamingResponse.d.ts.map