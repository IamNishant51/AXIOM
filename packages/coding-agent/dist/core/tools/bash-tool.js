/**
 * Enhanced Bash Tool - With security validation
 */
import { Type } from "@sinclair/typebox";
import { execSync } from "node:child_process";
import { checkCommand, validatePath, checkReadOnly, getCommandCategory } from "./bash-security.js";
export function createBashTool(options = {}) {
    const { timeout = 60000, maxOutputSize = 1024 * 1024, // 1MB
     } = options;
    return {
        name: "bash",
        label: "Bash",
        description: "Execute a shell command safely with validation",
        parameters: Type.Object({
            command: Type.String({ description: "The command to execute" }),
            path: Type.Optional(Type.String({ description: "Working directory (optional)" })),
            timeout: Type.Optional(Type.Number({ description: "Timeout in milliseconds" })),
        }),
        async execute(_toolCallId, params) {
            const command = params.command;
            const workDir = params.path || process.cwd();
            // Security check
            const securityCheck = checkCommand(command);
            if (!securityCheck.allowed) {
                throw new Error(`BLOCKED: ${securityCheck.message}`);
            }
            // Path validation
            const pathCheck = validatePath(command);
            if (!pathCheck.valid) {
                throw new Error(`BLOCKED: ${pathCheck.error}`);
            }
            // Check read-only filesystem
            const isReadOnly = await checkReadOnly(workDir);
            if (isReadOnly && (command.includes("write") || command.includes("touch") || command.includes("mkdir"))) {
                throw new Error("BLOCKED: Filesystem is read-only");
            }
            const startTime = Date.now();
            const category = getCommandCategory(command);
            const timeoutMs = params.timeout || timeout;
            try {
                const output = execSync(command, {
                    encoding: "utf-8",
                    stdio: ["pipe", "pipe", "pipe"],
                    timeout: timeoutMs,
                    cwd: workDir,
                    maxBuffer: maxOutputSize,
                });
                const duration = Date.now() - startTime;
                const warning = securityCheck.requiresConfirmation ? `Security: ${securityCheck.message}` : undefined;
                const details = {
                    command,
                    exitCode: 0,
                    duration,
                    category,
                };
                if (warning)
                    details.warning = warning;
                return {
                    content: [{ type: "text", text: String(output) }],
                    details,
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorOutput = error.stdout || error.message || "Command failed";
                const exitCode = error.status || 1;
                throw new Error(errorOutput);
            }
        },
    };
}
// Export enhanced bash tool
export const secureBashTool = createBashTool();
//# sourceMappingURL=bash-tool.js.map