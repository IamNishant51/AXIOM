/**
 * Bash Security - Dangerous command detection and validation
 * Prevents execution of harmful commands with user confirmation
 */
export type DangerLevel = "none" | "low" | "medium" | "high" | "critical";
export interface SecurityCheck {
    allowed: boolean;
    danger: DangerLevel;
    message: string;
    requiresConfirmation: boolean;
}
/**
 * Check a command for dangerous patterns
 */
export declare function checkCommand(command: string): SecurityCheck;
/**
 * Validate file path to prevent directory traversal
 */
export declare function validatePath(targetPath: string, basePath?: string): {
    valid: boolean;
    error?: string;
};
/**
 * Check if filesystem is read-only
 */
export declare function checkReadOnly(path: string): Promise<boolean>;
/**
 * Get command category for logging
 */
export declare function getCommandCategory(command: string): string;
//# sourceMappingURL=bash-security.d.ts.map