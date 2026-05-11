/**
 * CopyButton - Copy code to clipboard button component
 * Terminal-friendly copy functionality
 */
import React from "react";
export interface CopyButtonProps {
    text: string;
    language?: string;
    onCopy?: (success: boolean) => void;
}
/**
 * CopyButton - Simple copy button for terminal
 */
export declare const CopyButton: React.FC<CopyButtonProps>;
/**
 * CopyButtonRow - Row with language label and copy button
 */
export declare const CopyButtonRow: React.FC<{
    language?: string;
    code: string;
    showLineNumbers?: boolean;
}>;
export default CopyButton;
//# sourceMappingURL=CopyButton.d.ts.map