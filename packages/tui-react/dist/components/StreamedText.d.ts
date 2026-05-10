/**
 * StreamedText Component - Typing effect with no layout jitter
 * Renders text with configurable character/word-by-character delay
 */
import React from "react";
export interface StreamedTextProps {
    text: string;
    speed?: "fast" | "normal" | "slow";
    mode?: "character" | "word";
    showCursor?: boolean;
    onComplete?: () => void;
    style?: "plain" | "code" | "markdown";
}
export declare const StreamedText: React.FC<StreamedTextProps>;
export declare const StaticText: React.FC<{
    children: React.ReactNode;
    color?: string;
    bold?: boolean;
}>;
export default StreamedText;
//# sourceMappingURL=StreamedText.d.ts.map