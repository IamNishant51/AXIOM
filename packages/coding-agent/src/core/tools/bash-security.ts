/**
 * Bash Security - Dangerous command detection and validation
 * Prevents execution of harmful commands with user confirmation
 */

// Danger level type
export type DangerLevel = "none" | "low" | "medium" | "high" | "critical";

// Dangerous patterns that require confirmation
interface DangerousPattern {
	pattern: RegExp;
	danger: DangerLevel;
	message: string;
}

const DANGEROUS_PATTERNS: DangerousPattern[] = [
	// Recursive delete
	{ pattern: /rm\s+(-[rf]+\s+)+[^\s]+|rm\s+-rf\s+\/|rm\s+-[rf]/i, danger: "high", message: "Recursive force delete" },

	// Fork bomb
	{ pattern: /:\(\)\{\s*:\|:\s*&\s*\};:/i, danger: "high", message: "Fork bomb detected" },

	// Format disk
	{ pattern: /(mkfs|format|dd)\s+(if=|of=).*(dev\/)/i, danger: "critical", message: "Disk format command" },

	// Overwrite boot sector
	{ pattern: /dd\s+.*of=\/(dev\/|boot)/i, danger: "critical", message: "Boot sector overwrite" },

	// Modify system files
	{ pattern: /echo\s+.*>\s*(\/etc\/|\/usr\/|\/bin\/|\/sbin\/)/i, danger: "high", message: "System file modification" },

	// Git reset --hard
	{ pattern: /git\s+reset\s+--hard/i, danger: "medium", message: "Git reset --hard (unrecoverable)" },

	// Reboot/shutdown
	{ pattern: /(reboot|shutdown|init\s+6|init\s+0)/i, danger: "high", message: "System reboot/shutdown" },

	// Chmod 777
	{ pattern: /chmod\s+777|chmod\s+-R\s+777/i, danger: "medium", message: "World-writable permissions" },

	// Curl to pipe
	{ pattern: /curl.*\|\s*(bash|sh|python|perl)/i, danger: "high", message: "Remote script execution" },

	// Wget to pipe
	{ pattern: /wget.*\|\s*(bash|sh|python|perl)/i, danger: "high", message: "Remote script execution" },

	// SQL injection patterns
	{ pattern: /('|--|;|drop\s+table|delete\s+from)/i, danger: "medium", message: "Potential SQL injection" },

	// SSH key generation
	{ pattern: /ssh-keygen.*-t\s+rsa.*-N\s+""/i, danger: "low", message: "SSH key without passphrase" },
];

export interface SecurityCheck {
	allowed: boolean;
	danger: DangerLevel;
	message: string;
	requiresConfirmation: boolean;
}

/**
 * Check a command for dangerous patterns
 */
export function checkCommand(command: string): SecurityCheck {
	for (const item of DANGEROUS_PATTERNS) {
		if (item.pattern.test(command)) {
			return {
				allowed: item.danger !== "critical",
				danger: item.danger,
				message: item.message,
				requiresConfirmation: item.danger === "high" || item.danger === "critical",
			};
		}
	}

	// Additional checks
	if (command.includes("sudo") && !command.includes("echo")) {
		return {
			allowed: true,
			danger: "low",
			message: "Sudo command - may require password",
			requiresConfirmation: false,
		};
	}

	return {
		allowed: true,
		danger: "none",
		message: "Command appears safe",
		requiresConfirmation: false,
	};
}

/**
 * Validate file path to prevent directory traversal
 */
export function validatePath(targetPath: string, basePath?: string): { valid: boolean; error?: string } {
	// Normalize path
	const normalized = targetPath.replace(/\\/g, "/");

	// Check for null bytes
	if (normalized.includes("\0")) {
		return { valid: false, error: "Path contains null bytes" };
	}

	// Check for directory traversal attempts
	const traversalPatterns = [
		/\.\.\//,           // Parent directory traversal
		/\.\.\.\//,         // Double parent
		/%2e%2e%2f/i,       // URL encoded parent
		/\.\.%2f/i,         // Partial encoded
	];

	for (const pattern of traversalPatterns) {
		if (pattern.test(normalized)) {
			return { valid: false, error: "Path traversal detected" };
		}
	}

	// If base path provided, ensure target is within base
	if (basePath) {
		const resolvedTarget = targetPath;
		const resolvedBase = basePath;

		if (!resolvedTarget.startsWith(resolvedBase)) {
			return { valid: false, error: "Path outside allowed directory" };
		}
	}

	return { valid: true };
}

/**
 * Check if filesystem is read-only
 */
export async function checkReadOnly(path: string): Promise<boolean> {
	try {
		const fs = await import("node:fs");
		// Try to write a temp file
		const testFile = `${path}/.axiom_readonly_test_${Date.now()}`;
		await fs.promises.writeFile(testFile, "test");
		await fs.promises.unlink(testFile);
		return false;
	} catch {
		return true;
	}
}

/**
 * Get command category for logging
 */
export function getCommandCategory(command: string): string {
	const lower = command.toLowerCase();

	if (lower.includes("git")) return "git";
	if (lower.includes("npm") || lower.includes("yarn") || lower.includes("pnpm")) return "package-manager";
	if (lower.includes("docker") || lower.includes("kubectl")) return "container";
	if (lower.includes("ssh") || lower.includes("scp")) return "remote";
	if (lower.includes("make") || lower.includes("cmake")) return "build";
	if (lower.includes("python") || lower.includes("node") || lower.includes("cargo")) return "runtime";
	if (lower.includes("curl") || lower.includes("wget")) return "network";

	return "general";
}