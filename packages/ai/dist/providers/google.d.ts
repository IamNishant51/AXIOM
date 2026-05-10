/**
 * Google Generative AI Provider Implementation
 * Axiom AI
 */
import type { Model, Context, StreamOptions, AssistantMessage } from "../types.js";
/**
 * Stream Google Generative AI API
 */
export declare function streamGoogle(model: Model<"google-generative-ai">, context: Context, options?: StreamOptions): AsyncIterable<any> & {
    result(): Promise<AssistantMessage>;
};
/**
 * Complete (non-streaming) Google
 */
export declare function completeGoogle(model: Model<"google-generative-ai">, context: Context, options?: StreamOptions): Promise<AssistantMessage>;
/**
 * Register Google provider
 */
export declare function registerGoogleProvider(): void;
//# sourceMappingURL=google.d.ts.map