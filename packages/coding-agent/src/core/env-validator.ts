/**
 * Environment schema validation and secret handling
 * Based on IMPROVEMENT.md security requirements
 */

import * as fs from "node:fs";
import * as path from "node:path";

// Supported environment variables
export const SUPPORTED_ENV_KEYS = [
  "OPENCODE_API_KEY",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "GROQ_API_KEY",
  "XAI_API_KEY",
  "CEREBRAS_API_KEY",
  "AXIOM_CONFIG_DIR",
  "AXIOM_DB_PATH",
  "AXIOM_LOG_LEVEL",
  "AXIOM_SECURE_MODE",
  "AXIOM_ALLOW_SHELL",
] as const;

export type SupportedEnvKey = typeof SUPPORTED_ENV_KEYS[number];

// Schema definition
export interface EnvSchema {
  [key: string]: {
    required: boolean;
    pattern?: RegExp;
    default?: string;
    description: string;
    secret?: boolean;  // Mask in logs
  };
}

export const envSchema: EnvSchema = {
  OPENCODE_API_KEY: { required: false, secret: true, description: "OpenCode API key" },
  ANTHROPIC_API_KEY: { required: false, secret: true, description: "Anthropic API key" },
  OPENAI_API_KEY: { required: false, secret: true, description: "OpenAI API key" },
  GEMINI_API_KEY: { required: false, secret: true, description: "Google Gemini API key" },
  GROQ_API_KEY: { required: false, secret: true, description: "Groq API key" },
  XAI_API_KEY: { required: false, secret: true, description: "xAI API key" },
  CEREBRAS_API_KEY: { required: false, secret: true, description: "Cerebras API key" },
  AXIOM_CONFIG_DIR: {
    required: false,
    default: "~/.axiom",
    description: "Configuration directory path"
  },
  AXIOM_DB_PATH: {
    required: false,
    description: "Custom SQLite database path"
  },
  AXIOM_LOG_LEVEL: {
    required: false,
    default: "info",
    pattern: /^(debug|info|warn|error)$/i,
    description: "Log level (debug, info, warn, error)"
  },
  AXIOM_SECURE_MODE: {
    required: false,
    pattern: /^(true|false)$/i,
    description: "Enable secure mode with command restrictions"
  },
  AXIOM_ALLOW_SHELL: {
    required: false,
    pattern: /^(true|false)$/i,
    description: "Allow shell command execution"
  },
};

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  secrets: Record<string, boolean>;  // Which keys are secrets
}

// Validate environment on startup
export function validateEnv(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    secrets: {},
  };

  for (const [key, schema] of Object.entries(envSchema)) {
    const value = process.env[key];

    // Check required
    if (schema.required && !value) {
      result.valid = false;
      result.errors.push(`Missing required environment variable: ${key}`);
    }

    // Check pattern
    if (value && schema.pattern && !schema.pattern.test(value)) {
      result.valid = false;
      result.errors.push(
        `Invalid value for ${key}. Expected pattern: ${schema.pattern}`
      );
    }

    // Track secrets
    if (schema.secret && value) {
      result.secrets[key] = true;
    }
  }

  // Warn about unknown env vars
  for (const key of Object.keys(process.env)) {
    if (!key.startsWith("AXIOM_") && !SUPPORTED_ENV_KEYS.includes(key as any)) {
      if (key.includes("API_KEY") || key.includes("SECRET")) {
        result.warnings.push(`Unexpected secret env var: ${key}`);
      }
    }
  }

  return result;
}

// Redact secrets from strings
export function redactSecrets(text: string, secrets: Record<string, boolean> = {}): string {
  let result = text;

  // Redact common patterns
  const patterns = [
    { regex: /([A-Z_]+API_KEY)\s*[:=]\s*['"]?([^'"\s,]+)/gi, replacement: "$1: [REDACTED]" },
    { regex: /("api[_-]?key"\s*:\s*)"([^"]+)"/gi, replacement: '$1"[REDACTED]"' },
    { regex: /(Bearer\s+)([A-Za-z0-9\-_.]+)/gi, replacement: "$1[REDACTED]" },
    { regex: /(sk-[A-Za-z0-9\-]{20,})/gi, replacement: "[API_KEY]" },
    { regex: /(sk-ant-[A-Za-z0-9\-]{50,})/gi, replacement: "[API_KEY]" },
  ];

  for (const { regex, replacement } of patterns) {
    result = result.replace(regex, replacement);
  }

  return result;
}

// Get a masked version of a secret value for display
export function maskSecret(value: string, visibleChars = 4): string {
  if (value.length <= visibleChars) {
    return "*".repeat(value.length);
  }
  return value.slice(0, visibleChars) + "*".repeat(Math.min(value.length - visibleChars, 20));
}

// Create env.example file
export function createEnvExample(configDir: string): string {
  const content = `# Axiom Environment Configuration
# Copy this file to .env and fill in your values

# API Keys (at least one required)
OPENCODE_API_KEY=your_opencode_key_here
# ANTHROPIC_API_KEY=your_anthropic_key_here
# OPENAI_API_KEY=your_openai_key_here

# Configuration
# AXIOM_CONFIG_DIR=~/.axiom
# AXIOM_LOG_LEVEL=info  # debug, info, warn, error
# AXIOM_SECURE_MODE=false
# AXIOM_ALLOW_SHELL=true
`;

  const filePath = path.join(configDir, "env.example");
  fs.writeFileSync(filePath, content);
  return filePath;
}

// Get log level from environment
export function getLogLevel(): "debug" | "info" | "warn" | "error" {
  const level = process.env.AXIOM_LOG_LEVEL?.toLowerCase();
  if (level === "debug" || level === "info" || level === "warn" || level === "error") {
    return level;
  }
  return "info";
}

// Check if secure mode is enabled
export function isSecureMode(): boolean {
  return process.env.AXIOM_SECURE_MODE?.toLowerCase() === "true";
}

// Check if shell commands are allowed
export function isShellAllowed(): boolean {
  if (isSecureMode()) return false;
  return process.env.AXIOM_ALLOW_SHELL?.toLowerCase() !== "false";
}