/**
 * Stream API - Core streaming interface for Axiom AI
 * Provides stream() and complete() functions
 */
import { getModel } from "./models.js";
import { getApi } from "./api-registry.js";
import { EventStream } from "./utils/event-stream.js";
/**
 * Create an event stream for streaming LLM responses
 */
export function stream(model, context, options) {
    // Resolve model if string
    const resolvedModel = typeof model === "string" ? getModelFromString(model) : model;
    if (!resolvedModel) {
        throw new Error(`Unknown model: ${model}`);
    }
    // Get API implementation
    const apiImpl = getApi(resolvedModel.api);
    if (!apiImpl) {
        throw new Error(`No implementation for API: ${resolvedModel.api}`);
    }
    // Create stream
    const eventStream = new EventStream((event) => event.type === "done" || event.type === "error", (event) => (event.type === "done" ? event.message : event.error));
    // Start the stream
    runStream(resolvedModel, context, options, eventStream).catch((err) => {
        eventStream.error(err instanceof Error ? err : new Error(String(err)));
    });
    // Return combined type
    const stream = eventStream;
    return stream;
}
/**
 * Simplified stream with reasoning support
 */
export function streamSimple(model, context, options) {
    // Map reasoning level to provider-specific options
    const enhancedOptions = {
        ...options,
        ...(options?.reasoning && {
        // Provider-specific reasoning configuration
        }),
    };
    return stream(model, context, enhancedOptions);
}
/**
 * Get complete response (non-streaming)
 */
export async function complete(model, context, options) {
    const streamResult = stream(model, context, options);
    return await streamResult.result();
}
/**
 * Simplified complete with reasoning support
 */
export async function completeSimple(model, context, options) {
    const streamResult = streamSimple(model, context, options);
    return await streamResult.result();
}
// Helper to resolve model from string (e.g., "anthropic/claude-sonnet-4")
function getModelFromString(modelStr) {
    // Check for provider/model format
    if (modelStr.includes("/")) {
        const [provider, modelId] = modelStr.split("/");
        const model = getModel(provider, modelId);
        if (model)
            return model;
    }
    // Try as direct model ID
    return getModel("openai", modelStr) || getModel("anthropic", modelStr) || getModel("google", modelStr);
}
// Internal: Run the stream
async function runStream(model, context, options, eventStream) {
    // Create partial message
    const partial = {
        role: "assistant",
        content: [],
        api: model.api,
        provider: model.provider,
        model: model.id,
        usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
        stopReason: "toolUse",
        timestamp: Date.now(),
    };
    // Emit start
    eventStream.push({ type: "start", partial: { ...partial } });
    try {
        // Get API implementation
        const apiImpl = getApi(model.api);
        if (!apiImpl) {
            throw new Error(`No API implementation for: ${model.api}`);
        }
        // Call the API
        const apiStream = apiImpl(model, context, options);
        // Process events from API
        for await (const event of apiStream) {
            eventStream.push(event);
        }
        // Get final result
        const result = await eventStream.result();
        eventStream.end(result);
    }
    catch (error) {
        // Emit error
        const errorMessage = {
            ...partial,
            stopReason: "error",
            errorMessage: error instanceof Error ? error.message : String(error),
        };
        eventStream.push({
            type: "error",
            reason: "error",
            error: errorMessage,
        });
        eventStream.end(errorMessage);
    }
}
//# sourceMappingURL=stream.js.map