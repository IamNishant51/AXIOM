/**
 * StatusBar - Persistent status display
 * Shows model, tokens, connection, memory, etc.
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
    onToggleInfo?: () => void;
}
export declare const StatusBar: React.FC<StatusBarProps>;
export declare const CompactStatus: React.FC<{
    processing?: boolean;
    toolName?: string;
}>;
export default StatusBar;
//# sourceMappingURL=StatusBar.d.ts.map