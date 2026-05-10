/**
 * OpenAI Completions Provider Implementation
 * Axiom AI - Supports OpenAI and OpenAI-compatible APIs (Groq, Cerebras, etc.)
 */
import { registerApi, getEnvApiKey } from "../api-registry.js";
import { createEventStream } from "../utils/event-stream.js";
/**
 * Stream OpenAI Completions API
 */
export function streamOpenAICompletions(model, context, options) {
    const apiKey = options?.apiKey || getEnvApiKey("openai");
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY not set");
    }
    const eventStream = createEventStream((event) => event.type === "done" || event.type === "error", (event) => event.message);
    runOpenAIStream(model, context, options, apiKey, eventStream).catch((err) => {
        eventStream.error(err instanceof Error ? err : new Error(String(err)));
    });
    return eventStream;
}
/**
 * Complete (non-streaming) OpenAI
 */
export async function completeOpenAI(model, context, options) {
    const stream = streamOpenAICompletions(model, context, options);
    return await stream.result();
}
async function runOpenAIStream(model, context, options, apiKey, eventStream) {
    // Transform messages to OpenAI format (Chat Completions)
    const openaiMessages = transformToOpenAI(context.messages);
    // Build request
    const requestBody = {
        model: model.id,
        messages: openaiMessages,
        stream: true,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 4096,
    };
    // Add tools if present
    if (context.tools && context.tools.length > 0) {
        requestBody.tools = context.tools.map((tool) => ({
            type: "function",
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
            },
        }));
    }
    // Determine base URL
    const baseUrl = model.baseUrl || "https://api.openai.com/v1";
    const url = `${baseUrl}/chat/completions`;
    // Make request
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }
    // Read streaming response
    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error("Failed to read response stream");
    }
    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";
    let fullToolCalls = [];
    let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
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
                const chunk = JSON.parse(data);
                // Update usage
                if (chunk.usage) {
                    usage = chunk.usage;
                }
                // Process content
                for (const choice of chunk.choices) {
                    if (choice.delta?.content) {
                        fullContent += choice.delta.content;
                        eventStream.push({
                            type: "text_delta",
                            contentIndex: 0,
                            delta: choice.delta.content,
                            partial: createPartialMessage(model, fullContent, fullToolCalls),
                        });
                    }
                    // Process tool calls
                    if (choice.delta?.tool_calls) {
                        for (const tc of choice.delta.tool_calls) {
                            // Find or create tool call
                            let existing = fullToolCalls.find((t) => t.id === tc.id);
                            if (!existing) {
                                existing = { id: tc.id, name: "", arguments: "" };
                                fullToolCalls.push(existing);
                            }
                            if (tc.function?.name)
                                existing.name = tc.function.name;
                            if (tc.function?.arguments)
                                existing.arguments += tc.function.arguments;
                        }
                        eventStream.push({
                            type: "toolcall_delta",
                            contentIndex: 0,
                            delta: JSON.stringify(fullToolCalls),
                            partial: createPartialMessage(model, fullContent, fullToolCalls),
                        });
                    }
                    // Handle finish
                    if (choice.finish_reason) {
                        const finalMessage = {
                            role: "assistant",
                            content: [
                                ...(fullContent ? [{ type: "text", text: fullContent }] : []),
                                ...fullToolCalls.map((tc) => ({
                                    type: "toolCall",
                                    id: tc.id,
                                    name: tc.name,
                                    arguments: parseJsonSafe(tc.arguments),
                                })),
                            ],
                            api: model.api,
                            provider: model.provider,
                            model: model.id,
                            usage: {
                                input: usage.prompt_tokens,
                                output: usage.completion_tokens,
                                cacheRead: 0,
                                cacheWrite: 0,
                                totalTokens: usage.total_tokens,
                                cost: {
                                    input: 0,
                                    output: 0,
                                    cacheRead: 0,
                                    cacheWrite: 0,
                                    total: 0,
                                },
                            },
                            stopReason: choice.finish_reason === "stop" ? "stop" : choice.finish_reason === "length" ? "length" : "toolUse",
                            timestamp: Date.now(),
                        };
                        eventStream.push({
                            type: "done",
                            reason: choice.finish_reason,
                            message: finalMessage,
                        });
                    }
                }
            }
            catch {
                // Skip parse errors
            }
        }
    }
    const result = await eventStream.result();
    eventStream.end(result);
}
/**
 * Transform messages to OpenAI format
 */
function transformToOpenAI(messages) {
    const result = [];
    // Add system message first if present
    const systemMsg = messages.find((m) => m.role === "system");
    if (systemMsg) {
        result.push({
            role: "system",
            content: typeof systemMsg.content === "string" ? systemMsg.content : systemMsg.content[0]?.text || "",
        });
    }
    // Add other messages
    for (const msg of messages) {
        if (msg.role === "system")
            continue;
        if (msg.role === "user") {
            const content = typeof msg.content === "string"
                ? msg.content
                : msg.content.map((block) => {
                    if (block.type === "text")
                        return { type: "text", text: block.text };
                    if (block.type === "image")
                        return { type: "image_url", image_url: { url: `data:${block.mimeType};base64,${block.data}` } };
                    return null;
                }).filter(Boolean);
            result.push({ role: "user", content });
        }
        if (msg.role === "assistant") {
            const content = [];
            for (const block of msg.content) {
                if (block.type === "text")
                    content.push({ type: "text", text: block.text });
                if (block.type === "toolCall") {
                    content.push({
                        tool_calls: [{
                                id: block.id,
                                type: "function",
                                function: { name: block.name, arguments: JSON.stringify(block.arguments) },
                            }],
                    });
                }
            }
            result.push({ role: "assistant", content: content.length > 0 ? content : undefined });
        }
        if (msg.role === "toolResult") {
            result.push({
                role: "tool",
                tool_call_id: msg.toolCallId,
                content: msg.content[0]?.text || "",
            });
        }
    }
    return result;
}
/**
 * Create partial message for streaming
 */
function createPartialMessage(model, content, toolCalls) {
    return {
        role: "assistant",
        content: [
            ...(content ? [{ type: "text", text: content }] : []),
            ...toolCalls.map((tc) => ({
                type: "toolCall",
                id: tc.id,
                name: tc.name,
                arguments: parseJsonSafe(tc.arguments) || {},
            })),
        ],
        api: model.api,
        provider: model.provider,
        model: model.id,
        usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
        stopReason: "toolUse",
        timestamp: Date.now(),
    };
}
/**
 * Safe JSON parse
 */
function parseJsonSafe(str) {
    try {
        return JSON.parse(str);
    }
    catch {
        return {};
    }
}
/**
 * Register OpenAI provider
 */
export function registerOpenAICompletionsProvider() {
    registerApi("openai-completions", streamOpenAICompletions);
}
//# sourceMappingURL=openai-completions.js.map