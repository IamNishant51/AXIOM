/**
 * StatusBar - Enhanced with OpenClaude-style animations
 * Persistent status display with token counter and smooth animations
 */
import React from "react";
export interface StatusBarProps {
    model?: string;
    totalTokens?: number;
    inputTokens?: number;
    outputTokens?: number;
    connectionStatus?: "connected" | "disconnected" | "connecting";
    memoryLoaded?: boolean;
    memoryFiles?: string[];
    mcpServers?: string[];
    isProcessing?: boolean;
    toolName?: string;
    reducedMotion?: boolean;
    onToggleInfo?: () => void;
}
export declare const StatusBar: React.FC<StatusBarProps>;
export declare const CompactStatus: React.FC<{
    processing?: boolean;
    toolName?: string;
    reducedMotion?: boolean;
}>;
export default StatusBar;
//# sourceMappingURL=StatusBar.d.ts.map