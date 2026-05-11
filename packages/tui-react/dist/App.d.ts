/**
 * App.tsx - Main Layout Component
 * Claude Code CLI Style Implementation
 */
import React from "react";
import { StatusState } from "./components/StatusIndicator.js";
export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: number;
    thinking?: string;
    toolCalls?: Array<{
        name: string;
        args: any;
        result?: string;
    }>;
}
export declare const App: React.FC<{
    messages?: Message[];
    onMessage?: (message: string) => void;
    onCommand?: (command: string) => void;
    aiState?: StatusState;
    aiMessage?: string;
    aiToolName?: string;
    isStreaming?: boolean;
    disabled?: boolean;
    commands?: Array<{
        name: string;
        description: string;
        action: string;
    }>;
}>;
export default App;
//# sourceMappingURL=App.d.ts.map