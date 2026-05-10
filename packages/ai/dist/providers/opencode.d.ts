/**
 * OpenCode Provider Implementation
 * Uses Anthropic-compatible API at https://opencode.ai/zen
 */
import type { Model, Context, StreamOptions, AssistantMessage } from "../types.js";
/**
 * Stream OpenCode API (non-streaming for now)
 */
export declare function streamOpenCode(model: Model<"opencode-messages">, context: Context, options?: StreamOptions): AsyncIterable<any> & {
    result(): Promise<AssistantMessage>;
};
/**
 * Complete (non-streaming) OpenCode
 */
export declare function completeOpenCode(model: Model<"opencode-messages">, context: Context, options?: StreamOptions): Promise<AssistantMessage>;
/**
 * Register OpenCode provider
 */
export declare function registerOpenCodeProvider(): void;
//# sourceMappingURL=opencode.d.ts.map