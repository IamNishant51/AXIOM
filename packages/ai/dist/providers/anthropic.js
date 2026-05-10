/**
 * Anthropic Provider Implementation
 * Axiom AI
 */
import { registerApi, getEnvApiKey } from "../api-registry.js";
import { createEventStream } from "../utils/event-stream.js";
/**
 * Stream Anthropic API
 */
export function streamAnthropic(model, context, options) {
    const apiKey = options?.apiKey || getEnvApiKey("anthropic");
    if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY not set");
    }
    const eventStream = createEventStream((event) => event.type === "message_stop", (event) => event.message);
    runAnthropicStream(model, context, options, apiKey, eventStream).catch((err) => {
        eventStream.error(err instanceof Error ? err : new Error(String(err)));
    });
    return eventStream;
}
/**
 * Complete (non-streaming) Anthropic API
 */
export async function completeAnthropic(model, context, options) {
    const stream = streamAnthropic(model, context, options);
    return await stream.result();
}
async function runAnthropicStream(model, context, options, apiKey, eventStream) {
    // Transform messages to Anthropic format
    const anthropicMessages = transformToAnthropic(context.messages);
    const systemPrompt = context.systemPrompt || "";
    // Build request
    const requestBody = {
        model: model.id,
        max_tokens: options?.maxTokens || 4096,
        messages: anthropicMessages,
        system: systemPrompt,
        stream: true,
    };
    // Add thinking if enabled (cast to any to bypass type check)
    const opts = options;
    if (opts?.thinkingEnabled) {
        requestBody.thinking = { type: "enabled", budget_tokens: opts.thinkingBudgetTokens || 8192 };
    }
    // Add tools if present
    if (context.tools && context.tools.length > 0) {
        requestBody.tools = context.tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.parameters,
        }));
    }
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
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }
    // Read streaming response
    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error("Failed to read response stream");
    }
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
            if (!line.startsWith("data: "))
                continue;
            const data = line.slice(6);
            if (data === "[DONE]")
                continue;
            try {
                const event = JSON.parse(data);
                const assistantEvent = transformEvent(event, model);
                if (assistantEvent) {
                    eventStream.push(assistantEvent);
                }
            }
            catch {
                // Skip parse errors
            }
        }
    }
    // Get final message
    const result = await eventStream.result();
    eventStream.end(result);
}
/**
 * Transform messages to Anthropic format
 */
function transformToAnthropic(messages) {
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
 * Transform Anthropic event to Axiom event
 */
function transformEvent(event, model) {
    switch (event.type) {
        case "message_start":
            return {
                type: "start",
                partial: {
                    role: "assistant",
                    content: [],
                    api: model.api,
                    provider: model.provider,
                    model: model.id,
                    usage: {
                        input: 0,
                        output: 0,
                        cacheRead: 0,
                        cacheWrite: 0,
                        totalTokens: 0,
                        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
                    },
                    stopReason: "toolUse",
                    timestamp: Date.now(),
                },
            };
        case "content_block_delta":
            if (event.delta?.type === "text_delta") {
                return {
                    type: "text_delta",
                    contentIndex: event.index || 0,
                    delta: event.delta.text || "",
                    partial: {
                        role: "assistant",
                        content: [{ type: "text", text: event.delta.text || "" }],
                        api: model.api,
                        provider: model.provider,
                        model: model.id,
                        usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
                        stopReason: "toolUse",
                        timestamp: Date.now(),
                    },
                };
            }
            if (event.delta?.type === "input_json_delta") {
                const deltaAny = event.delta;
                return {
                    type: "toolcall_delta",
                    contentIndex: event.index || 0,
                    delta: JSON.stringify(deltaAny.partial_json || {}),
                    partial: {
                        role: "assistant",
                        content: [{
                                type: "toolCall",
                                id: event.content_block?.id || "",
                                name: event.content_block?.name || "",
                                arguments: deltaAny.partial_json || {},
                            }],
                        api: model.api,
                        provider: model.provider,
                        model: model.id,
                        usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
                        stopReason: "toolUse",
                        timestamp: Date.now(),
                    },
                };
            }
            break;
        case "content_block_stop":
            if (event.content_block?.type === "tool_use") {
                return {
                    type: "toolcall_end",
                    contentIndex: event.index || 0,
                    toolCall: {
                        type: "toolCall",
                        id: event.content_block.id || "",
                        name: event.content_block.name || "",
                        arguments: {},
                    },
                    partial: {
                        role: "assistant",
                        content: [],
                        api: model.api,
                        provider: model.provider,
                        model: model.id,
                        usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
                        stopReason: "toolUse",
                        timestamp: Date.now(),
                    },
                };
            }
            break;
        case "message_delta":
            if (event.usage?.output_tokens) {
                return {
                    type: "done",
                    reason: event.message?.stop_reason === "end_turn" ? "stop" : "length",
                    message: {
                        role: "assistant",
                        content: event.message?.content?.map((block) => {
                            if (block.type === "text")
                                return { type: "text", text: block.text || "" };
                            if (block.type === "tool_use")
                                return { type: "toolCall", id: block.id || "", name: block.name || "", arguments: block.input || {} };
                            return null;
                        }).filter(Boolean) || [],
                        api: model.api,
                        provider: model.provider,
                        model: model.id,
                        usage: {
                            input: event.message?.usage?.input_tokens || 0,
                            output: event.usage.output_tokens || 0,
                            cacheRead: 0,
                            cacheWrite: 0,
                            totalTokens: (event.message?.usage?.input_tokens || 0) + (event.usage.output_tokens || 0),
                            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
                        },
                        stopReason: event.message?.stop_reason === "end_turn" ? "stop" : "length",
                        timestamp: Date.now(),
                    },
                };
            }
            break;
        case "message_stop":
            // Emit done event when stream ends
            return {
                type: "done",
                reason: event.message?.stop_reason === "end_turn" ? "stop" : "length",
                message: {
                    role: "assistant",
                    content: event.message?.content?.map((block) => {
                        if (block.type === "text")
                            return { type: "text", text: block.text || "" };
                        if (block.type === "tool_use")
                            return { type: "toolCall", id: block.id || "", name: block.name || "", arguments: block.input || {} };
                        return null;
                    }).filter(Boolean) || [],
                    api: model.api,
                    provider: model.provider,
                    model: model.id,
                    usage: {
                        input: event.message?.usage?.input_tokens || 0,
                        output: event.message?.usage?.output_tokens || 0,
                        cacheRead: 0,
                        cacheWrite: 0,
                        totalTokens: (event.message?.usage?.input_tokens || 0) + (event.message?.usage?.output_tokens || 0),
                        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
                    },
                    stopReason: event.message?.stop_reason === "end_turn" ? "stop" : "length",
                    timestamp: Date.now(),
                },
            };
    }
    return null;
}
/**
 * Register Anthropic provider
 */
export function registerAnthropicProvider() {
    registerApi("anthropic-messages", streamAnthropic);
}
//# sourceMappingURL=anthropic.js.map