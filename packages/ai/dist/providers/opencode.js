/**
 * OpenCode Provider Implementation
 * Uses Anthropic-compatible API at https://opencode.ai/zen
 */
import { registerApi, getEnvApiKey } from "../api-registry.js";
import { createEventStream } from "../utils/event-stream.js";
/**
 * Stream OpenCode API (non-streaming for now)
 */
export function streamOpenCode(model, context, options) {
    const apiKey = options?.apiKey || getEnvApiKey("opencode");
    if (!apiKey) {
        throw new Error("OPENCODE_API_KEY not set");
    }
    const eventStream = createEventStream((event) => event.type === "done", (event) => event.message);
    runOpenCodeStream(model, context, options, apiKey, eventStream).catch((err) => {
        eventStream.error(err instanceof Error ? err : new Error(String(err)));
    });
    return eventStream;
}
/**
 * Complete (non-streaming) OpenCode
 */
export async function completeOpenCode(model, context, options) {
    const stream = streamOpenCode(model, context, options);
    return await stream.result();
}
async function runOpenCodeStream(model, context, options, apiKey, eventStream) {
    // Transform messages to OpenCode format
    const opencodeMessages = transformToOpenCode(context.messages);
    const systemPrompt = context.systemPrompt || "";
    // Build request (non-streaming for reliability)
    const requestBody = {
        model: model.id,
        max_tokens: options?.maxTokens || 4096,
        messages: opencodeMessages,
        system: systemPrompt,
    };
    // Make request
    const response = await fetch(`${model.baseUrl}/v1/messages`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenCode API error: ${response.status} - ${errorText}`);
    }
    // Handle non-streaming response
    const data = await response.json();
    // Transform to our event format
    const message = data;
    // Create the full message
    const content = message.content?.map((block) => {
        if (block.type === "text")
            return { type: "text", text: block.text || "" };
        if (block.type === "thinking")
            return { type: "thinking", thinking: block.thinking || "" };
        if (block.type === "tool_use")
            return { type: "toolCall", id: block.id || "", name: block.name || "", arguments: block.input || {} };
        return null;
    }).filter(Boolean) || [];
    const fullMessage = {
        role: "assistant",
        content: content,
        api: model.api,
        provider: model.provider,
        model: model.id,
        usage: {
            input: message.usage?.input_tokens || 0,
            output: message.usage?.output_tokens || 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0),
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
        },
        stopReason: message.stop_reason === "end_turn" ? "stop" : "length",
        timestamp: Date.now(),
    };
    // Push text content as text_delta events (stream.ts already emits start event)
    for (const block of fullMessage.content) {
        if (block.type === "thinking") {
            eventStream.push({
                type: "thinking_delta",
                contentIndex: 0,
                delta: block.thinking,
                partial: fullMessage,
            });
        }
        if (block.type === "text") {
            eventStream.push({
                type: "text_delta",
                contentIndex: 0,
                delta: block.text,
                partial: fullMessage,
            });
        }
    }
    eventStream.push({
        type: "done",
        reason: message.stop_reason === "end_turn" ? "stop" : "length",
        message: fullMessage,
    });
}
/**
 * Transform messages to OpenCode format
 */
function transformToOpenCode(messages) {
    return messages.map((msg) => {
        if (msg.role === "user") {
            const content = typeof msg.content === "string"
                ? msg.content
                : msg.content.map((block) => {
                    if (block.type === "text")
                        return { type: "text", text: block.text };
                    if (block.type === "image") {
                        return {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: block.mimeType,
                                data: block.data,
                            },
                        };
                    }
                    return null;
                }).filter(Boolean);
            return { role: "user", content };
        }
        if (msg.role === "assistant") {
            const content = msg.content.map((block) => {
                if (block.type === "text")
                    return { type: "text", text: block.text };
                if (block.type === "thinking")
                    return { type: "thinking", thinking: block.thinking };
                if (block.type === "toolCall") {
                    return {
                        type: "tool_use",
                        id: block.id,
                        name: block.name,
                        input: block.arguments,
                    };
                }
                return null;
            }).filter(Boolean);
            return { role: "assistant", content };
        }
        if (msg.role === "toolResult") {
            return {
                type: "tool_result",
                tool_use_id: msg.toolCallId,
                content: msg.content[0]?.text || "",
            };
        }
        return null;
    }).filter(Boolean);
}
/**
 * Register OpenCode provider
 */
export function registerOpenCodeProvider() {
    registerApi("opencode-messages", streamOpenCode);
}
//# sourceMappingURL=opencode.js.map