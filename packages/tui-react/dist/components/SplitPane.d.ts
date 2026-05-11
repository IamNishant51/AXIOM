/**
 * SplitPane - Split view with resizable panes
 * Left: Context (files, task, chat), Right: Live execution
 */
import React from "react";
export type SplitDirection = "horizontal" | "vertical";
export interface SplitPaneProps {
    children: [React.ReactNode, React.ReactNode];
    direction?: SplitDirection;
    defaultSplit?: number;
    minSize?: number;
    maxSize?: number;
}
export declare const SplitPane: React.FC<SplitPaneProps>;
export interface TabItem {
    id: string;
    label: string;
    content: React.ReactNode;
}
export interface TabContainerProps {
    tabs: TabItem[];
    defaultTab?: string;
    onChange?: (tabId: string) => void;
}
export declare const TabContainer: React.FC<TabContainerProps>;
export default SplitPane;
//# sourceMappingURL=SplitPane.d.ts.map