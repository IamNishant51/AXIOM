/**
 * InputManager Component - Claude Code CLI Style
 * Clean, minimal input with proper styling and comprehensive backspace support
 */
import React from "react";
export interface Command {
    name: string;
    description: string;
    action: string;
}
export interface InputManagerProps {
    onSubmit: (value: string) => void;
    placeholder?: string;
    commands?: Command[];
    disabled?: boolean;
}
export declare const InputManager: React.FC<InputManagerProps>;
export default InputManager;
//# sourceMappingURL=InputManager.d.ts.map