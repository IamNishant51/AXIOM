/**
 * PermissionDialog - Authorization prompts for tool execution
 * Like Claude Code's permission dialogs
 */
import React from "react";
export type PermissionType = "tool" | "write" | "dangerous" | "network";
export interface PermissionDialogProps {
    type: PermissionType;
    title: string;
    message: string;
    details?: string;
    onAllow: () => void;
    onDeny: () => void;
    onAllowOnce?: () => void;
    preview?: string;
}
export declare const PermissionDialog: React.FC<PermissionDialogProps>;
export declare class PermissionManager {
    private queue;
    private current;
    private onRequest;
    constructor(onRequest: (permission: PermissionDialogProps) => void);
    add(permission: PermissionDialogProps): void;
    private process;
    resolve(allowed: boolean, allowOnce?: boolean): void;
}
export default PermissionDialog;
//# sourceMappingURL=PermissionDialog.d.ts.map