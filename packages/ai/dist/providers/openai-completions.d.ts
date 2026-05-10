/**
 * OpenAI Completions Provider Implementation
 * Axiom AI - Supports OpenAI and OpenAI-compatible APIs (Groq, Cerebras, etc.)
 */
import type { Model, Context, StreamOptions, AssistantMessage } from "../types.js";
/**
 * Stream OpenAI Completions API
 */
export declare function streamOpenAICompletions(model: Model<"openai-completions">, context: Context, options?: StreamOptions): AsyncIterable<any> & {
    result(): Promise<AssistantMessage>;
};
/**
 * Complete (non-streaming) OpenAI
 */
export declare function completeOpenAI(model: Model<"openai-completions">, context: Context, options?: StreamOptions): Promise<AssistantMessage>;
/**
 * Register OpenAI provider
 */
export declare function registerOpenAICompletionsProvider(): void;
//# sourceMappingURL=openai-completions.d.ts.map