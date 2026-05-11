/**
 * SmoothSpinner Component - Enhanced animation like Claude Code
 * Multiple spinner styles with different speeds
 */
import React from "react";
export interface SmoothSpinnerProps {
    type?: "thinking" | "working" | "loading";
    size?: "small" | "medium" | "large";
    label?: string;
    color?: string;
    speed?: "slow" | "normal" | "fast";
    reducedMotion?: boolean;
}
export declare const SmoothSpinner: React.FC<SmoothSpinnerProps>;
export declare const StatusIndicatorDot: React.FC<{
    isActive: boolean;
    label?: string;
}>;
export default SmoothSpinner;
//# sourceMappingURL=SmoothSpinner.d.ts.map