/**
 * Schema validation using TypeBox
 * Based on IMPROVEMENT.md security requirements
 */

import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";

// Tool argument schemas
export const ToolArgumentSchema = Type.Object({
  command: Type.Optional(Type.String()),
  path: Type.Optional(Type.String()),
  content: Type.Optional(Type.String()),
  pattern: Type.Optional(Type.String()),
  options: Type.Optional(Type.Record(Type.String(), Type.Any())),
});

export type ToolArgument = Static<typeof ToolArgumentSchema>;

// Tool call schema
export const ToolCallSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  args: Type.Record(Type.String(), Type.Any()),
  status: Type.Union([
    Type.Literal("pending"),
    Type.Literal("running"),
    Type.Literal("done"),
    Type.Literal("error"),
  ]),
});

export type ToolCall = Static<typeof ToolCallSchema>;

// Session schema
export const SessionSchema = Type.Object({
  id: Type.String(),
  parentId: Type.Union([Type.String(), Type.Null()]),
  title: Type.String(),
  model: Type.String(),
  createdAt: Type.Number(),
  updatedAt: Type.Number(),
  summary: Type.Optional(Type.Object({
    additions: Type.Number(),
    deletions: Type.Number(),
    files: Type.Number(),
  })),
});

export type Session = Static<typeof SessionSchema>;

// Message schema
export const MessageSchema = Type.Object({
  id: Type.String(),
  sessionId: Type.String(),
  role: Type.Union([Type.Literal("user"), Type.Literal("assistant")]),
  createdAt: Type.Number(),
  completedAt: Type.Union([Type.Number(), Type.Null()]),
  parts: Type.Array(Type.Object({
    id: Type.String(),
    messageId: Type.String(),
    type: Type.Union([
      Type.Literal("text"),
      Type.Literal("reasoning"),
      Type.Literal("tool-call"),
      Type.Literal("tool-result"),
    ]),
    content: Type.String(),
    step: Type.Optional(Type.Number()),
    toolName: Type.Optional(Type.String()),
    toolArgs: Type.Optional(Type.String()),
    toolResult: Type.Optional(Type.String()),
  })),
});

export type Message = Static<typeof MessageSchema>;

// Memory item schema
export const MemoryItemSchema = Type.Object({
  id: Type.String(),
  key: Type.String(),
  value: Type.String(),
  createdAt: Type.Number(),
  updatedAt: Type.Number(),
  tags: Type.Array(Type.String()),
});

export type MemoryItem = Static<typeof MemoryItemSchema>;

// Snapshot schema
export const SnapshotSchema = Type.Object({
  id: Type.String(),
  sessionId: Type.String(),
  title: Type.String(),
  description: Type.Optional(Type.String()),
  createdAt: Type.Number(),
  tokenCount: Type.Number(),
  messageCount: Type.Number(),
});

export type Snapshot = Static<typeof SnapshotSchema>;

// Agent state schema
export const AgentStateSchema = Type.Object({
  systemPrompt: Type.String(),
  model: Type.String(),
  tools: Type.Array(Type.Object({
    name: Type.String(),
    description: Type.String(),
  })),
  messages: Type.Array(MessageSchema),
});

export type AgentState = Static<typeof AgentStateSchema>;

// Tool invocation schema
export const ToolInvocationSchema = Type.Object({
  id: Type.String(),
  sessionId: Type.String(),
  messageId: Type.Union([Type.String(), Type.Null()]),
  toolName: Type.String(),
  toolArgs: Type.Union([Type.String(), Type.Null()]),
  toolResult: Type.Union([Type.String(), Type.Null()]),
  status: Type.Union([
    Type.Literal("pending"),
    Type.Literal("running"),
    Type.Literal("done"),
    Type.Literal("error"),
  ]),
  step: Type.Union([Type.Number(), Type.Null()]),
  createdAt: Type.Number(),
  completedAt: Type.Union([Type.Number(), Type.Null()]),
  error: Type.Union([Type.String(), Type.Null()]),
  durationMs: Type.Union([Type.Number(), Type.Null()]),
});

export type ToolInvocation = Static<typeof ToolInvocationSchema>;

// Validation errors
export interface ValidationError {
  path: string;
  message: string;
}

// Simple validation using TypeBox's built-in checks
export class SchemaValidator {
  // Validate tool arguments with simple checks
  validateToolArguments(
    _toolName: string,
    args: Record<string, unknown>
  ): { valid: boolean; errors?: ValidationError[] } {
    const errors: ValidationError[] = [];

    // Check command length
    if (args.command && typeof args.command === "string" && args.command.length > 10000) {
      errors.push({ path: "command", message: "Command exceeds maximum length of 10000" });
    }

    // Check path length
    if (args.path && typeof args.path === "string" && args.path.length > 4096) {
      errors.push({ path: "path", message: "Path exceeds maximum length of 4096" });
    }

    // Check content length
    if (args.content && typeof args.content === "string" && args.content.length > 1000000) {
      errors.push({ path: "content", message: "Content exceeds maximum length of 1000000" });
    }

    // Check pattern length
    if (args.pattern && typeof args.pattern === "string" && args.pattern.length > 1000) {
      errors.push({ path: "pattern", message: "Pattern exceeds maximum length of 1000" });
    }

    return errors.length > 0 ? { valid: false, errors } : { valid: true };
  }

  // Validate session
  validateSession(data: unknown): { valid: boolean; session?: Session; errors?: ValidationError[] } {
    const errors: ValidationError[] = [];

    if (!data || typeof data !== "object") {
      return { valid: false, errors: [{ path: "/", message: "Session must be an object" }] };
    }

    const session = data as Record<string, unknown>;

    // Required fields
    if (!session.id || typeof session.id !== "string") {
      errors.push({ path: "id", message: "id is required and must be a string" });
    }
    if (!session.title || typeof session.title !== "string") {
      errors.push({ path: "title", message: "title is required and must be a string" });
    }
    if (!session.model || typeof session.model !== "string") {
      errors.push({ path: "model", message: "model is required and must be a string" });
    }

    // Timestamps
    if (session.createdAt !== undefined && typeof session.createdAt !== "number") {
      errors.push({ path: "createdAt", message: "createdAt must be a number" });
    }
    if (session.updatedAt !== undefined && typeof session.updatedAt !== "number") {
      errors.push({ path: "updatedAt", message: "updatedAt must be a number" });
    }

    return errors.length > 0 ? { valid: false, errors } : { valid: true, session: data as Session };
  }

  // Validate message
  validateMessage(data: unknown): { valid: boolean; message?: Message; errors?: ValidationError[] } {
    const errors: ValidationError[] = [];

    if (!data || typeof data !== "object") {
      return { valid: false, errors: [{ path: "/", message: "Message must be an object" }] };
    }

    const message = data as Record<string, unknown>;

    if (!message.id || typeof message.id !== "string") {
      errors.push({ path: "id", message: "id is required and must be a string" });
    }
    if (!message.sessionId || typeof message.sessionId !== "string") {
      errors.push({ path: "sessionId", message: "sessionId is required and must be a string" });
    }
    if (message.role !== "user" && message.role !== "assistant") {
      errors.push({ path: "role", message: "role must be 'user' or 'assistant'" });
    }

    return errors.length > 0 ? { valid: false, errors } : { valid: true, message: data as Message };
  }

  // Validate memory item
  validateMemoryItem(data: unknown): { valid: boolean; item?: MemoryItem; errors?: ValidationError[] } {
    const errors: ValidationError[] = [];

    if (!data || typeof data !== "object") {
      return { valid: false, errors: [{ path: "/", message: "Memory item must be an object" }] };
    }

    const item = data as Record<string, unknown>;

    if (!item.key || typeof item.key !== "string") {
      errors.push({ path: "key", message: "key is required and must be a string" });
    }
    if (item.value !== undefined && typeof item.value !== "string") {
      errors.push({ path: "value", message: "value must be a string" });
    }

    return errors.length > 0 ? { valid: false, errors } : { valid: true, item: data as MemoryItem };
  }
}

// Singleton instance
let validator: SchemaValidator | null = null;

export function getValidator(): SchemaValidator {
  if (!validator) {
    validator = new SchemaValidator();
  }
  return validator;
}

// Convenience functions
export function validateSession(data: unknown) {
  return getValidator().validateSession(data);
}

export function validateMessage(data: unknown) {
  return getValidator().validateMessage(data);
}

export function validateMemoryItem(data: unknown) {
  return getValidator().validateMemoryItem(data);
}

export function validateToolArguments(toolName: string, args: Record<string, unknown>) {
  return getValidator().validateToolArguments(toolName, args);
}