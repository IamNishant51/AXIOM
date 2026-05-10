/**
 * InputManager Component - Premium command input with / palette
 * Simple, robust implementation
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