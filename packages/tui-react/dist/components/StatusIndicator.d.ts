/**
 * StatusIndicator Component - 60fps smooth animation
 * Premium spinner with fluid state transitions
 */
import React from "react";
export type StatusState = "idle" | "thinking" | "working" | "success" | "error";
export interface StatusIndicatorProps {
    state?: StatusState;
    message?: string;
    toolName?: string;
    size?: "small" | "medium";
}
export declare const StatusIndicator: React.FC<StatusIndicatorProps>;
export default StatusIndicator;
//# sourceMappingURL=StatusIndicator.d.ts.map