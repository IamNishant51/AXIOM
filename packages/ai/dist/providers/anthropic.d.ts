/**
 * Anthropic Provider Implementation
 * Axiom AI
 */
import type { Model, Context, StreamOptions, AssistantMessage } from "../types.js";
/**
 * Stream Anthropic API
 */
export declare function streamAnthropic(model: Model<"anthropic-messages">, context: Context, options?: StreamOptions & {
    thinkingEnabled?: boolean;
    thinkingBudgetTokens?: number;
}): AsyncIterable<any> & {
    result(): Promise<AssistantMessage>;
};
/**
 * Complete (non-streaming) Anthropic API
 */
export declare function completeAnthropic(model: Model<"anthropic-messages">, context: Context, options?: StreamOptions): Promise<AssistantMessage>;
/**
 * Register Anthropic provider
 */
export declare function registerAnthropicProvider(): void;
//# sourceMappingURL=anthropic.d.ts.map