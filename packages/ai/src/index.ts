/**
 * Axiom AI - Unified LLM API
 * Main exports
 */

export type { Static, TSchema } from "@sinclair/typebox";
export { Type } from "@sinclair/typebox";

// Core exports
export * from "./types.js";
export * from "./models.js";
export * from "./stream.js";
export * from "./env-api-keys.js";
export * from "./api-registry.js";
export * from "./utils/event-stream.js";
export * from "./utils/validation.js";

// Re-export common types for convenience
export type {
	AssistantMessageEvent,
	Context,
	Model,
	Tool,
	Message,
	UserMessage,
	AssistantMessage,
	ToolResultMessage,
	TextContent,
	ThinkingContent,
	ImageContent,
	ToolCall,
	Usage,
	StopReason,
	StreamOptions,
	SimpleStreamOptions,
	ThinkingLevel,
	ThinkingBudgets,
	CacheRetention,
	Transport,
	Provider,
	Api,
} from "./types.js";