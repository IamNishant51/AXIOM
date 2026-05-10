/**
 * Google Generative AI Provider Implementation
 * Axiom AI
 */
import { registerApi, getEnvApiKey } from "../api-registry.js";
import { createEventStream } from "../utils/event-stream.js";
/**
 * Stream Google Generative AI API
 */
export function streamGoogle(model, context, options) {
    const apiKey = options?.apiKey || getEnvApiKey("google");
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY not set");
    }
    const eventStream = createEventStream((event) => event.type === "done" || event.type === "error", (event) => event.message);
    runGoogleStream(model, context, options, apiKey, eventStream).catch((err) => {
        eventStream.error(err instanceof Error ? err : new Error(String(err)));
    });
    return eventStream;
}
/**
 * Complete (non-streaming) Google
 */
export async function completeGoogle(model, context, options) {
    const stream = streamGoogle(model, context, options);
    return await stream.result();
}
async function runGoogleStream(model, context, options, apiKey, eventStream) {
    // Transform messages to Google format
    const googleMessages = transformToGoogle(context.messages);
    // Build request
    const requestBody = {
        contents: googleMessages,
        generationConfig: {
            temperature: options?.temperature || 0.9,
            maxOutputTokens: options?.maxTokens || 2048,
            tools: context.tools?.map((tool) => ({
                functionDeclarations: [{
                        name: tool.name,
                        description: tool.description,
                        parameters: tool.parameters,
                    }],
            })),
        },
    };
    // Add system instruction
    if (context.systemPrompt) {
        requestBody.systemInstruction = {
            role: "system",
            parts: [{ text: context.systemPrompt }],
        };
    }
    // Build URL
    const baseUrl = model.baseUrl || "https://generativelanguage.googleapis.com";
    const url = `${baseUrl}/v1beta/models/${model.id}:streamGenerateContent?key=${apiKey}`;
    // Make request
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google API error: ${response.status} - ${errorText}`);
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
    let usage = { prompt_tokens: 0, candidates_token_count: 0, total_tokens: 0 };
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
            if (!line.trim())
                continue;
            try {
                const chunk = JSON.parse(line);
                if (chunk.candidates) {
                    for (const candidate of chunk.candidates) {
                        if (candidate.content?.parts) {
                            for (const part of candidate.content.parts) {
                                // Text content
                                if (part.text) {
                                    fullContent += part.text;
                                    eventStream.push({
                                        type: "text_delta",
                                        contentIndex: 0,
                                        delta: part.text,
                                        partial: createPartialMessage(model, fullContent, fullToolCalls),
                                    });
                                }
                                // Function call
                                if (part.functionCall) {
                                    const fc = part.functionCall;
                                    let existing = fullToolCalls.find((t) => t.name === fc.name);
                                    if (!existing) {
                                        existing = { id: `call_${Date.now()}`, name: fc.name, arguments: "" };
                                        fullToolCalls.push(existing);
                                    }
                                    if (fc.args)
                                        existing.arguments += typeof fc.args === "string" ? fc.args : JSON.stringify(fc.args);
                                    eventStream.push({
                                        type: "toolcall_delta",
                                        contentIndex: 0,
                                        delta: JSON.stringify(fullToolCalls),
                                        partial: createPartialMessage(model, fullContent, fullToolCalls),
                                    });
                                }
                            }
                        }
                        // Handle finish
                        if (candidate.finishReason) {
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
                                    output: usage.candidates_token_count,
                                    cacheRead: 0,
                                    cacheWrite: 0,
                                    totalTokens: usage.total_tokens,
                                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
                                },
                                stopReason: candidate.finishReason === "STOP" ? "stop" : candidate.finishReason === "MAX_TOKENS" ? "length" : "toolUse",
                                timestamp: Date.now(),
                            };
                            eventStream.push({
                                type: "done",
                                reason: candidate.finishReason === "STOP" ? "stop" : "length",
                                message: finalMessage,
                            });
                        }
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
 * Transform messages to Google format
 */
function transformToGoogle(messages) {
    const result = [];
    for (const msg of messages) {
        if (msg.role === "user") {
            const content = typeof msg.content === "string"
                ? msg.content
                : msg.content.map((block) => {
                    if (block.type === "text")
                        return { text: block.text };
                    if (block.type === "image")
                        return { inlineData: { mimeType: block.mimeType, data: block.data } };
                    return null;
                }).filter(Boolean);
            result.push({ role: "user", parts: content });
        }
        if (msg.role === "assistant") {
            const parts = [];
            for (const block of msg.content) {
                if (block.type === "text")
                    parts.push({ text: block.text });
                if (block.type === "toolCall") {
                    parts.push({
                        functionCall: {
                            name: block.name,
                            args: block.arguments,
                        },
                    });
                }
            }
            result.push({ role: "model", parts });
        }
        if (msg.role === "toolResult") {
            result.push({
                role: "function_response",
                parts: [{
                        name: msg.toolName,
                        content: msg.content[0]?.text || "",
                    }],
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
 * Register Google provider
 */
export function registerGoogleProvider() {
    registerApi("google-generative-ai", streamGoogle);
}
//# sourceMappingURL=google.js.map