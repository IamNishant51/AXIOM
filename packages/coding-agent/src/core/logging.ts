/**
 * Structured logging for Axiom
 * Based on IMPROVEMENT.md observability requirements
 */

import { getLogLevel } from "./env-validator.js";
import { redactSecrets } from "./env-validator.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  sessionId?: string;
  toolName?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
}

// Log levels in order of verbosity
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Request ID counter
let requestCounter = 0;

function generateRequestId(): string {
  return `req_${Date.now()}_${++requestCounter}`;
}

// Logger class
export class Logger {
  private level: LogLevel;
  private requestId: string;
  private sessionId: string | null = null;
  private toolName: string | null = null;

  constructor(level?: LogLevel) {
    this.level = level || getLogLevel();
    this.requestId = generateRequestId();
  }

  setSession(sessionId: string): this {
    this.sessionId = sessionId;
    return this;
  }

  setRequestId(requestId: string): this {
    this.requestId = requestId;
    return this;
  }

  setTool(toolName: string): this {
    this.toolName = toolName;
    return this;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatEntry(entry: LogEntry): string {
    const base = {
      timestamp: entry.timestamp,
      level: entry.level.toUpperCase(),
      message: entry.message,
      requestId: entry.requestId,
      sessionId: entry.sessionId,
      toolName: entry.toolName,
      duration: entry.duration,
      error: entry.error,
      metadata: entry.metadata,
    };

    // Remove undefined fields
    const filtered = Object.fromEntries(
      Object.entries(base).filter(([, v]) => v !== undefined)
    );

    return JSON.stringify(filtered);
  }

  private log(
    level: LogLevel,
    message: string,
    error?: Error,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: redactSecrets(message),
      requestId: this.requestId,
      sessionId: this.sessionId || undefined,
      toolName: this.toolName || undefined,
      metadata,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const formatted = this.formatEntry(entry);

    // Output to stderr for errors, stdout for others
    if (level === "error") {
      console.error(formatted);
    } else {
      console.log(formatted);
    }
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log("debug", message, undefined, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log("info", message, undefined, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log("warn", message, undefined, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.log("error", message, error, metadata);
  }

  // Tool execution logging
  logToolStart(toolName: string, args: Record<string, unknown>): void {
    this.info(`Tool started: ${toolName}`, {
      toolArgs: redactSecrets(JSON.stringify(args)),
    });
  }

  logToolEnd(toolName: string, duration: number, success: boolean, error?: string): void {
    const level = success ? "info" : "error";
    const message = `Tool ${success ? "completed" : "failed"}: ${toolName} (${duration}ms)`;
    this.log(level, message, undefined, { error });
  }

  // Token usage logging
  logTokenUsage(inputTokens: number, outputTokens: number, model: string): void {
    this.info("Token usage", {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      model,
    });
  }

  // Response latency logging
  logLatency(operation: string, duration: number): void {
    this.debug(`${operation} latency`, { durationMs: duration });
  }
}

// Global logger instance
let globalLogger: Logger | null = null;

export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = new Logger();
  }
  return globalLogger;
}

// Create a child logger with session context
export function createLogger(sessionId?: string): Logger {
  const logger = new Logger();
  if (sessionId) {
    logger.setSession(sessionId);
  }
  return logger;
}

// Metrics collector for observability
export interface Metrics {
  toolCalls: number;
  totalTokenUsage: number;
  avgResponseTime: number;
  errors: number;
  sessions: number;
}

export class MetricsCollector {
  private metrics: Metrics = {
    toolCalls: 0,
    totalTokenUsage: 0,
    avgResponseTime: 0,
    errors: 0,
    sessions: 0,
  };

  private responseTimes: number[] = [];

  incrementToolCalls(): void {
    this.metrics.toolCalls++;
  }

  addTokenUsage(tokens: number): void {
    this.metrics.totalTokenUsage += tokens;
  }

  recordResponseTime(ms: number): void {
    this.responseTimes.push(ms);
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
    this.metrics.avgResponseTime =
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }

  incrementErrors(): void {
    this.metrics.errors++;
  }

  incrementSessions(): void {
    this.metrics.sessions++;
  }

  getMetrics(): Metrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      toolCalls: 0,
      totalTokenUsage: 0,
      avgResponseTime: 0,
      errors: 0,
      sessions: 0,
    };
    this.responseTimes = [];
  }
}