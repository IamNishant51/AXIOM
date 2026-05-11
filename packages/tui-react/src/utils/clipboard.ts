/**
 * Clipboard - Terminal clipboard operations
 * Supports both Unix (xclip/pbcopy) and basic copy detection
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";

export interface ClipboardResult {
	success: boolean;
	content?: string;
	error?: string;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<ClipboardResult> {
	// Try platform-specific clipboard
	const platform = os.platform();

	try {
		if (platform === "darwin") {
			// macOS
			execSync(`echo '${text.replace(/'/g, "'\\''")}' | pbcopy`, { encoding: "utf-8" });
		} else if (platform === "linux") {
			// Linux - try xclip first, then xsel
			try {
				execSync(`echo '${text.replace(/'/g, "'\\''")}' | xclip -selection clipboard`, { encoding: "utf-8" });
			} catch {
				execSync(`echo '${text.replace(/'/g, "'\\''")}' | xsel --clipboard`, { encoding: "utf-8" });
			}
		} else {
			// Windows - use clip.exe
			execSync(`echo ${text} | clip`, { encoding: "utf-8" });
		}
		return { success: true };
	} catch (error) {
		return {
			success: false,
			error: `Failed to copy: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

/**
 * Read from clipboard
 */
export async function readFromClipboard(): Promise<ClipboardResult> {
	const platform = os.platform();

	try {
		let content = "";

		if (platform === "darwin") {
			content = execSync("pbpaste", { encoding: "utf-8" });
		} else if (platform === "linux") {
			try {
				content = execSync("xclip -selection clipboard -o", { encoding: "utf-8" });
			} catch {
				content = execSync("xsel --clipboard -o", { encoding: "utf-8" });
			}
		} else {
			// Windows - use PowerShell
			content = execSync(
				'powershell -Command "Get-Clipboard"',
				{ encoding: "utf-8" }
			);
		}

		return { success: true, content: content.trim() };
	} catch (error) {
		return {
			success: false,
			error: `Failed to read: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

/**
 * Check if clipboard tools are available
 */
export function isClipboardAvailable(): boolean {
	const platform = os.platform();

	try {
		if (platform === "darwin") {
			execSync("which pbcopy", { encoding: "utf-8" });
		} else if (platform === "linux") {
			try {
				execSync("which xclip", { encoding: "utf-8" });
			} catch {
				execSync("which xsel", { encoding: "utf-8" });
			}
		}
		return true;
	} catch {
		return false;
	}
}

/**
 * Copy to selection clipboard (Linux primary selection)
 */
export async function copyToSelection(text: string): Promise<ClipboardResult> {
	const platform = os.platform();

	if (platform !== "linux") {
		return { success: false, error: "Primary selection only available on Linux" };
	}

	try {
		execSync(`echo '${text.replace(/'/g, "'\\''")}' | xclip -selection primary`, { encoding: "utf-8" });
		return { success: true };
	} catch (error) {
		return {
			success: false,
			error: `Failed to copy to selection: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}