/**
 * VimInput - Vim-style input mode
 * Provides vim keybindings for text editing
 */
import React from "react";
export type VimMode = "normal" | "insert" | "visual";
export interface VimInputProps {
    onSubmit: (value: string) => void;
    placeholder?: string;
    initialValue?: string;
}
export declare const VimInput: React.FC<VimInputProps>;
export default VimInput;
//# sourceMappingURL=VimInput.d.ts.map