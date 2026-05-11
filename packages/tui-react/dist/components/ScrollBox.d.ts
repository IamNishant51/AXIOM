/**
 * ScrollBox - Virtual scrolling container for large lists
 * Efficient rendering for messages, history, etc.
 */
import React from "react";
export interface ScrollBoxProps {
    children: React.ReactNode;
    height?: number;
    width?: number | string;
    scrollPosition?: number;
    onScroll?: (position: number) => void;
    showScrollbar?: boolean;
}
export declare const ScrollBox: React.FC<ScrollBoxProps>;
export default ScrollBox;
//# sourceMappingURL=ScrollBox.d.ts.map