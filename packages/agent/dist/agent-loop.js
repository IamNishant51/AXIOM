/**
 * Agent Loop - Core agent runtime
 * Axiom Agent Core
 */
import { EventStream, streamSimple, validateToolArguments, } from "@axiom/ai";
/**
 * Start an agent loop with a new prompt
 */
export function agentLoop(prompts, context, config, signal, streamFn) {
    const stream = createAgentStream();
    void runAgentLoop(prompts, context, config, (event) => {
        stream.push(event);
    }, signal, streamFn).then((messages) => {
        stream.end(messages);
    });
    return stream;
}
/**
 * Continue from existing context
 */
export function agentLoopContinue(context, config, signal, streamFn) {
    if (context.messages.length === 0) {
        throw new Error("Cannot continue: no messages in context");
    }
    if (context.messages[context.messages.length - 1].role === "assistant") {
        throw new Error("Cannot continue from message role: assistant");
    }
    const stream = createAgentStream();
    void runAgentLoopContinue(context, config, (event) => {
        stream.push(event);
    }, signal, streamFn).then((messages) => {
        stream.end(messages);
    });
    return stream;
}
export async function runAgentLoop(prompts, context, config, emit, signal, streamFn) {
    const newMessages = [...prompts];
    const currentContext = {
        ...context,
        messages: [...context.messages, ...prompts],
    };
    await emit({ type: "agent_start" });
    await emit({ type: "turn_start" });
    for (const prompt of prompts) {
        await emit({ type: "message_start", message: prompt });
        await emit({ type: "message_end", message: prompt });
    }
    await runLoop(currentContext, newMessages, config, signal, emit, streamFn);
    return newMessages;
}
export async function runAgentLoopContinue(context, config, emit, signal, streamFn) {
    if (context.messages.length === 0) {
        throw new Error("Cannot continue: no messages in context");
    }
    if (context.messages[context.messages.length - 1].role === "assistant") {
        throw new Error("Cannot continue from message role: assistant");
    }
    const newMessages = [];
    await emit({ type: "agent_start" });
    await emit({ type: "turn_start" });
    await runLoop(context, newMessages, config, signal, emit, streamFn);
    return newMessages;
}
async function runLoop(currentContext, newMessages, config, signal, emit, streamFn) {
    let firstTurn = true;
    let pendingMessages = (await config.getSteeringMessages?.()) || [];
    while (true) {
        let hasMoreToolCalls = true;
        while (hasMoreToolCalls || pendingMessages.length > 0) {
            if (!firstTurn) {
                await emit({ type: "turn_start" });
            }
            else {
                firstTurn = false;
            }
            if (pendingMessages.length > 0) {
                for (const message of pendingMessages) {
                    await emit({ type: "message_start", message });
                    await emit({ type: "message_end", message });
                    currentContext.messages.push(message);
                    newMessages.push(message);
                }
                pendingMessages = [];
            }
            const message = await streamAssistantResponse(currentContext, config, signal, emit, streamFn);
            newMessages.push(message);
            if (message.stopReason === "error" || message.stopReason === "aborted") {
                await emit({ type: "turn_end", message, toolResults: [] });
                await emit({ type: "agent_end", messages: newMessages });
                return;
            }
            const toolCalls = message.content.filter((c) => c.type === "toolCall");
            hasMoreToolCalls = toolCalls.length > 0;
            const toolResults = [];
            if (hasMoreToolCalls) {
                toolResults.push(...(await executeToolCalls(currentContext, message, config, signal, emit)));
                for (const result of toolResults) {
                    currentContext.messages.push(result);
                    newMessages.push(result);
                }
            }
            await emit({ type: "turn_end", message, toolResults });
            pendingMessages = (await config.getSteeringMessages?.()) || [];
        }
        const followUpMessages = (await config.getFollowUpMessages?.()) || [];
        if (followUpMessages.length > 0) {
            pendingMessages = followUpMessages;
            continue;
        }
        break;
    }
    await emit({ type: "agent_end", messages: newMessages });
}
async function streamAssistantResponse(context, config, signal, emit, streamFn) {
    let messages = context.messages;
    if (config.transformContext) {
        messages = await config.transformContext(messages, signal);
    }
    const llmMessages = await config.convertToLlm(messages);
    const llmContext = {
        systemPrompt: context.systemPrompt,
        messages: llmMessages,
        tools: context.tools,
    };
    const streamFunction = streamFn || streamSimple;
    const resolvedApiKey = (config.getApiKey ? await config.getApiKey(config.model.provider) : undefined) || config.apiKey;
    const response = await streamFunction(config.model, llmContext, {
        ...config,
        apiKey: resolvedApiKey,
        signal,
    });
    let partialMessage = null;
    let addedPartial = false;
    for await (const event of response) {
        switch (event.type) {
            case "start":
                partialMessage = event.partial;
                context.messages.push(partialMessage);
                addedPartial = true;
                await emit({ type: "message_start", message: { ...partialMessage } });
                break;
            case "text_start":
            case "text_delta":
            case "text_end":
            case "thinking_start":
            case "thinking_delta":
            case "thinking_end":
            case "toolcall_start":
            case "toolcall_delta":
            case "toolcall_end":
                if (partialMessage) {
                    partialMessage = event.partial;
                    context.messages[context.messages.length - 1] = partialMessage;
                    await emit({
                        type: "message_update",
                        assistantMessageEvent: event,
                        message: { ...partialMessage },
                    });
                }
                break;
            case "done":
            case "error": {
                const finalMessage = await response.result();
                if (addedPartial) {
                    context.messages[context.messages.length - 1] = finalMessage;
                }
                else {
                    context.messages.push(finalMessage);
                }
                if (!addedPartial) {
                    await emit({ type: "message_start", message: { ...finalMessage } });
                }
                await emit({ type: "message_end", message: finalMessage });
                return finalMessage;
            }
        }
    }
    // Fallback - should have returned in done case
    const finalMessage = await response.result();
    if (addedPartial) {
        context.messages[context.messages.length - 1] = finalMessage;
    }
    else {
        context.messages.push(finalMessage);
    }
    if (!addedPartial) {
        await emit({ type: "message_start", message: { ...finalMessage } });
    }
    await emit({ type: "message_end", message: finalMessage });
    return finalMessage;
}
async function executeToolCalls(context, message, config, signal, emit) {
    const toolCalls = message.content.filter((c) => c.type === "toolCall");
    const results = [];
    for (const toolCall of toolCalls) {
        const tool = context.tools?.find((t) => t.name === toolCall.name);
        if (!tool) {
            results.push(createToolErrorResult(toolCall, `Unknown tool: ${toolCall.name}`));
            continue;
        }
        await emit({
            type: "tool_execution_start",
            toolCallId: toolCall.id,
            toolName: toolCall.name,
            args: toolCall.arguments,
        });
        try {
            const validatedArgs = validateToolArguments(tool, toolCall);
            const result = await tool.execute(toolCall.id, validatedArgs, signal);
            results.push({
                role: "toolResult",
                toolCallId: toolCall.id,
                toolName: toolCall.name,
                content: result.content,
                details: result.details,
                isError: false,
                timestamp: Date.now(),
            });
            await emit({
                type: "tool_execution_end",
                toolCallId: toolCall.id,
                toolName: toolCall.name,
                result: result.details,
                isError: false,
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            results.push(createToolErrorResult(toolCall, errorMessage));
            await emit({
                type: "tool_execution_end",
                toolCallId: toolCall.id,
                toolName: toolCall.name,
                result: { error: errorMessage },
                isError: true,
            });
        }
    }
    return results;
}
function createToolErrorResult(toolCall, error) {
    return {
        role: "toolResult",
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        content: [{ type: "text", text: `Error: ${error}` }],
        details: { error },
        isError: true,
        timestamp: Date.now(),
    };
}
function createAgentStream() {
    return new EventStream((event) => event.type === "agent_end", (event) => event.messages);
}
//# sourceMappingURL=agent-loop.js.map