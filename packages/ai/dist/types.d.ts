/**
 * Axiom AI - Unified LLM API Types
 * Based on pi-ai architecture
 */
import type { TSchema } from "@sinclair/typebox";
export { EventStream } from "./utils/event-stream.js";
export type KnownApi = "openai-completions" | "mistral-conversations" | "openai-responses" | "azure-openai-responses" | "openai-codex-responses" | "anthropic-messages" | "bedrock-converse-stream" | "google-generative-ai" | "google-gemini-cli" | "google-vertex";
export type Api = KnownApi | (string & {});
export type KnownProvider = "amazon-bedrock" | "anthropic" | "google" | "google-gemini-cli" | "google-antigravity" | "google-vertex" | "openai" | "azure-openai-responses" | "openai-codex" | "github-copilot" | "xai" | "groq" | "cerebras" | "openrouter" | "vercel-ai-gateway" | "zai" | "mistral" | "minimax" | "minimax-cn" | "huggingface" | "opencode" | "opencode-go" | "kimi-coding";
export type Provider = KnownProvider | string;
export type ThinkingLevel = "minimal" | "low" | "medium" | "high" | "xhigh";
export interface ThinkingBudgets {
    minimal?: number;
    low?: number;
    medium?: number;
    high?: number;
}
export type CacheRetention = "none" | "short" | "long";
export type Transport = "sse" | "websocket" | "auto";
export interface StreamOptions {
    temperature?: number;
    maxTokens?: number;
    signal?: AbortSignal;
    apiKey?: string;
    transport?: Transport;
    cacheRetention?: CacheRetention;
    sessionId?: string;
    onPayload?: (payload: unknown, model: Model<Api>) => unknown | undefined | Promise<unknown | undefined>;
    headers?: Record<string, string>;
    maxRetryDelayMs?: number;
    metadata?: Record<string, unknown>;
}
export type ProviderStreamOptions = StreamOptions & Record<string, unknown>;
export interface SimpleStreamOptions extends StreamOptions {
    reasoning?: ThinkingLevel;
    thinkingBudgets?: ThinkingBudgets;
}
export type StreamFunction<TApi extends Api = Api, TOptions extends StreamOptions = StreamOptions> = (model: Model<TApi>, context: Context, options?: TOptions) => any;
export interface TextSignatureV1 {
    v: 1;
    id: string;
    phase?: "commentary" | "final_answer";
}
export interface TextContent {
    type: "text";
    text: string;
    textSignature?: string;
}
export interface ThinkingContent {
    type: "thinking";
    thinking: string;
    thinkingSignature?: string;
    redacted?: boolean;
}
export interface ImageContent {
    type: "image";
    data: string;
    mimeType: string;
}
export interface ToolCall {
    type: "toolCall";
    id: string;
    name: string;
    arguments: Record<string, any>;
    thoughtSignature?: string;
}
export interface Usage {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    totalTokens: number;
    cost: {
        input: number;
        output: number;
        cacheRead: number;
        cacheWrite: number;
        total: number;
    };
}
export type StopReason = "stop" | "length" | "toolUse" | "error" | "aborted";
export interface UserMessage {
    role: "user";
    content: string | (TextContent | ImageContent)[];
    timestamp: number;
}
export interface AssistantMessage {
    role: "assistant";
    content: (TextContent | ThinkingContent | ToolCall)[];
    api: Api;
    provider: Provider;
    model: string;
    responseId?: string;
    usage: Usage;
    stopReason: StopReason;
    errorMessage?: string;
    timestamp: number;
}
export interface ToolResultMessage<TDetails = any> {
    role: "toolResult";
    toolCallId: string;
    toolName: string;
    content: (TextContent | ImageContent)[];
    details?: TDetails;
    isError: boolean;
    timestamp: number;
}
export type Message = UserMessage | AssistantMessage | ToolResultMessage;
export interface Tool<TParameters extends TSchema = TSchema> {
    name: string;
    description: string;
    parameters: TParameters;
}
export interface Context {
    systemPrompt?: string;
    messages: Message[];
    tools?: Tool[];
}
export type AssistantMessageEvent = {
    type: "start";
    partial: AssistantMessage;
} | {
    type: "text_start";
    contentIndex: number;
    partial: AssistantMessage;
} | {
    type: "text_delta";
    contentIndex: number;
    delta: string;
    partial: AssistantMessage;
} | {
    type: "text_end";
    contentIndex: number;
    content: string;
    partial: AssistantMessage;
} | {
    type: "thinking_start";
    contentIndex: number;
    partial: AssistantMessage;
} | {
    type: "thinking_delta";
    contentIndex: number;
    delta: string;
    partial: AssistantMessage;
} | {
    type: "thinking_end";
    contentIndex: number;
    content: string;
    partial: AssistantMessage;
} | {
    type: "toolcall_start";
    contentIndex: number;
    partial: AssistantMessage;
} | {
    type: "toolcall_delta";
    contentIndex: number;
    delta: string;
    partial: AssistantMessage;
} | {
    type: "toolcall_end";
    contentIndex: number;
    toolCall: ToolCall;
    partial: AssistantMessage;
} | {
    type: "done";
    reason: Extract<StopReason, "stop" | "length" | "toolUse">;
    message: AssistantMessage;
} | {
    type: "error";
    reason: Extract<StopReason, "aborted" | "error">;
    error: AssistantMessage;
};
export interface OpenAICompletionsCompat {
    supportsStore?: boolean;
    supportsDeveloperRole?: boolean;
    supportsReasoningEffort?: boolean;
    reasoningEffortMap?: Partial<Record<ThinkingLevel, string>>;
    supportsUsageInStreaming?: boolean;
    maxTokensField?: "max_completion_tokens" | "max_tokens";
    requiresToolResultName?: boolean;
    requiresAssistantAfterToolResult?: boolean;
    requiresThinkingAsText?: boolean;
    thinkingFormat?: "openai" | "openrouter" | "zai" | "qwen" | "qwen-chat-template";
    openRouterRouting?: OpenRouterRouting;
    vercelGatewayRouting?: VercelGatewayRouting;
    zaiToolStream?: boolean;
    supportsStrictMode?: boolean;
}
export interface OpenAIResponsesCompat {
}
export interface OpenRouterRouting {
    only?: string[];
    order?: string[];
}
export interface VercelGatewayRouting {
    only?: string[];
    order?: string[];
}
export interface Model<TApi extends Api> {
    id: string;
    name: string;
    api: TApi;
    provider: Provider;
    baseUrl: string;
    reasoning: boolean;
    input: ("text" | "image")[];
    cost: {
        input: number;
        output: number;
        cacheRead: number;
        cacheWrite: number;
    };
    contextWindow: number;
    maxTokens: number;
    headers?: Record<string, string>;
    compat?: TApi extends "openai-completions" ? OpenAICompletionsCompat : TApi extends "openai-responses" ? OpenAIResponsesCompat : never;
}
//# sourceMappingURL=types.d.ts.map