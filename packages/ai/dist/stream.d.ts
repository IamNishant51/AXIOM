/**
 * Stream API - Core streaming interface for Axiom AI
 * Provides stream() and complete() functions
 */
import type { Api, AssistantMessage, AssistantMessageEvent, Context, Model, SimpleStreamOptions, StreamOptions } from "./types.js";
/**
 * Create an event stream for streaming LLM responses
 */
export declare function stream<TApi extends Api = Api>(model: Model<TApi> | string, context: Context, options?: StreamOptions): AsyncIterable<AssistantMessageEvent> & {
    result(): Promise<AssistantMessage>;
};
/**
 * Simplified stream with reasoning support
 */
export declare function streamSimple(model: Model<any> | string, context: Context, options?: SimpleStreamOptions): AsyncIterable<AssistantMessageEvent> & {
    result(): Promise<AssistantMessage>;
};
/**
 * Get complete response (non-streaming)
 */
export declare function complete<TApi extends Api = Api>(model: Model<TApi> | string, context: Context, options?: StreamOptions): Promise<AssistantMessage>;
/**
 * Simplified complete with reasoning support
 */
export declare function completeSimple(model: Model<any> | string, context: Context, options?: SimpleStreamOptions): Promise<AssistantMessage>;
export type { StreamOptions, SimpleStreamOptions };
export type { AssistantMessageEvent, Context, Model };
//# sourceMappingURL=stream.d.ts.map