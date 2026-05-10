/**
 * Panel Component - Premium container with Unicode borders
 * Uses rounded box-drawing characters for elegant framing
 */
import React from "react";
export interface PanelProps {
    children: React.ReactNode;
    title?: string;
    padding?: number;
    borderStyle?: "rounded" | "none";
    minHeight?: number;
    flexGrow?: number;
}
export declare const Panel: React.FC<PanelProps>;
export default Panel;
//# sourceMappingURL=Panel.d.ts.map