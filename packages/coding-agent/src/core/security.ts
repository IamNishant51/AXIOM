/**
 * Shell command allowlist and validation
 * Based on IMPROVEMENT.md security requirements
 */

// Default allowlist of safe commands
export const DEFAULT_ALLOWED_COMMANDS = new Set([
  // File operations
  "ls", "la", "ll", "dir", "stat",
  "cat", "head", "tail", "wc", "grep", "rg", "find",
  "cd", "pwd", "mkdir", "rmdir", "touch", "rm", "cp", "mv",
  "chmod", "chown", "ln", "readlink",

  // Git
  "git", "gh",

  // Development
  "node", "npm", "pnpm", "yarn", "bun",
  "python", "python3", "pip", "pip3",
  "cargo", "rustc", "go", "java", "javac",
  "gcc", "g++", "clang", "make", "cmake",

  // Package managers
  "apt", "apt-get", "aptitude",
  "brew",
  "yum", "dnf",
  "pacman",

  // System
  "ps", "kill", "killall", "top", "htop",
  "df", "du", "free", "uname",
  "curl", "wget", "ping", "ssh", "scp",
  "tar", "gzip", "gunzip", "zip", "unzip",

  // Text processing
  "sed", "awk", "sort", "uniq", "cut", "tr", "tee",
  "jq", "yq", "rg", "fzf",
]);

// Commands that require explicit confirmation
export const DANGEROUS_COMMANDS = new Set([
  "rm", "rm -rf", "del", "format",
  "shutdown", "reboot", "halt", "poweroff",
  "dd", "fdisk", "mkfs",
  "chmod 777", "chmod -R 777",
  "curl", "wget",
]);

// Commands blocked by default (even with allowlist)
export const BLOCKED_COMMANDS = new Set([
  "sudo", "su",
  "eval", "exec",
  "base64", "openssl",
]);

export interface CommandValidation {
  allowed: boolean;
  requiresConfirmation: boolean;
  reason?: string;
}

// Check if a command is allowed
export function validateCommand(
  command: string,
  allowedCommands: Set<string> = DEFAULT_ALLOWED_COMMANDS
): CommandValidation {
  const trimmed = command.trim();
  const parts = trimmed.split(/\s+/);
  const baseCmd = parts[0];

  // Check blocked commands first
  if (BLOCKED_COMMANDS.has(baseCmd)) {
    return {
      allowed: false,
      requiresConfirmation: false,
      reason: `${baseCmd} is blocked for security reasons`,
    };
  }

  // Check if in allowlist
  if (!allowedCommands.has(baseCmd)) {
    return {
      allowed: false,
      requiresConfirmation: true,
      reason: `${baseCmd} is not in the allowed commands list`,
    };
  }

  // Check for dangerous patterns
  for (const dangerous of DANGEROUS_COMMANDS) {
    if (trimmed.includes(dangerous)) {
      return {
        allowed: true,
        requiresConfirmation: true,
        reason: `${dangerous} command requires confirmation`,
      };
    }
  }

  return { allowed: true, requiresConfirmation: false };
}

// Validate path to ensure it's within sandbox
export function validatePath(
  filePath: string,
  sandboxRoot: string,
  allowSymlinks = false
): { valid: boolean; resolved?: string; reason?: string } {
  const fs = require("node:fs");
  const path = require("node:path");

  // Resolve to absolute path
  let resolved: string;
  try {
    resolved = path.resolve(sandboxRoot, filePath);
    if (!allowSymlinks) {
      resolved = fs.realpathSync(resolved);
    }
  } catch {
    return { valid: false, reason: "Cannot resolve path" };
  }

  // Normalize sandbox root
  const normalizedSandbox = path.normalize(sandboxRoot);
  const normalizedResolved = path.normalize(resolved);

  // Ensure path is within sandbox
  if (!normalizedResolved.startsWith(normalizedSandbox)) {
    return {
      valid: false,
      reason: "Path escapes sandbox",
    };
  }

  return { valid: true, resolved };
}

// Validate argument count
export function validateArgCount(
  command: string,
  maxArgs = 50,
  maxLength = 10000
): { valid: boolean; reason?: string } {
  const parts = command.trim().split(/\s+/);

  if (parts.length > maxArgs) {
    return {
      valid: false,
      reason: `Too many arguments (max ${maxArgs})`,
    };
  }

  if (command.length > maxLength) {
    return {
      valid: false,
      reason: `Command too long (max ${maxLength} chars)`,
    };
  }

  return { valid: true };
}

// Rate limiter for tool calls
export class ToolCallRateLimiter {
  private calls: Map<string, number[]> = new Map();
  private maxCalls: number;
  private windowMs: number;

  constructor(maxCalls = 20, windowMs = 60000) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
  }

  check(sessionId: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const calls = this.calls.get(sessionId) || [];

    // Remove old calls outside window
    const validCalls = calls.filter(t => now - t < this.windowMs);
    this.calls.set(sessionId, validCalls);

    if (validCalls.length >= this.maxCalls) {
      const oldest = validCalls[0];
      const retryAfter = this.windowMs - (now - oldest);
      return { allowed: false, retryAfter };
    }

    validCalls.push(now);
    this.calls.set(sessionId, validCalls);
    return { allowed: true };
  }

  reset(sessionId: string): void {
    this.calls.delete(sessionId);
  }
}