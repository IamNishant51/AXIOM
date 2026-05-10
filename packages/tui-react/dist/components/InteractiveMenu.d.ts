/**
 * InteractiveMenu Component - Premium keyboard-driven menu
 * Handles up/down/enter smoothly with cursor and dimmed inactive options
 */
import React from "react";
export interface MenuItem {
    label: string;
    value?: string;
    description?: string;
    disabled?: boolean;
    action?: () => void;
}
export interface InteractiveMenuProps {
    items: MenuItem[];
    onSelect: (item: MenuItem, index: number) => void;
    onCancel?: () => void;
    defaultIndex?: number;
    showCursor?: boolean;
    dimInactive?: boolean;
    pageSize?: number;
}
export declare const InteractiveMenu: React.FC<InteractiveMenuProps>;
export declare function useMenuInput(onKeyPress: (key: string) => void): (input: string, key: {
    return: string;
    escape: string;
    up: string;
    down: string;
}) => void;
export default InteractiveMenu;
//# sourceMappingURL=InteractiveMenu.d.ts.map