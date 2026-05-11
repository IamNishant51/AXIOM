/**
 * ToolOutput Component - Real-time tool execution display
 * Shows command output as it happens, like Claude Code
 */
import React from "react";
export interface ToolOutputProps {
    toolName: string;
    command?: string;
    output?: string;
    isRunning?: boolean;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
    maxHeight?: number;
}
export declare const ToolOutput: React.FC<ToolOutputProps>;
export declare const ToolChain: React.FC<{
    tools: Array<{
        name: string;
        command?: string;
        output?: string;
        isRunning?: boolean;
        isExpanded?: boolean;
    }>;
}>;
export default ToolOutput;
//# sourceMappingURL=ToolOutput.d.ts.map