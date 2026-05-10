/**
 * Agent - High-level stateful agent wrapper
 * Axiom Agent Core
 */
import { type ImageContent, type Message, type SimpleStreamOptions, type ThinkingBudgets, type Transport } from "@axiom/ai";
import type { AfterToolCallContext, AfterToolCallResult, AgentEvent, AgentMessage, AgentState, BeforeToolCallContext, BeforeToolCallResult, StreamFn, ToolExecutionMode } from "./types.js";
type QueueMode = "all" | "one-at-a-time";
export interface AgentOptions {
    initialState?: Partial<Omit<AgentState, "pendingToolCalls" | "isStreaming" | "streamingMessage" | "errorMessage">>;
    convertToLlm?: (messages: AgentMessage[]) => Message[] | Promise<Message[]>;
    transformContext?: (messages: AgentMessage[], signal?: AbortSignal) => Promise<AgentMessage[]>;
    streamFn?: StreamFn;
    getApiKey?: (provider: string) => Promise<string | undefined> | string | undefined;
    onPayload?: SimpleStreamOptions["onPayload"];
    beforeToolCall?: (context: BeforeToolCallContext, signal?: AbortSignal) => Promise<BeforeToolCallResult | undefined>;
    afterToolCall?: (context: AfterToolCallContext, signal?: AbortSignal) => Promise<AfterToolCallResult | undefined>;
    steeringMode?: QueueMode;
    followUpMode?: QueueMode;
    sessionId?: string;
    thinkingBudgets?: ThinkingBudgets;
    transport?: Transport;
    maxRetryDelayMs?: number;
    toolExecution?: ToolExecutionMode;
}
/**
 * Stateful Agent wrapper
 */
export declare class Agent {
    private _state;
    private readonly listeners;
    private readonly steeringQueue;
    private readonly followUpQueue;
    convertToLlm: (messages: AgentMessage[]) => Message[] | Promise<Message[]>;
    transformContext?: (messages: AgentMessage[], signal?: AbortSignal) => Promise<AgentMessage[]>;
    streamFn: StreamFn;
    getApiKey?: (provider: string) => Promise<string | undefined> | string | undefined;
    onPayload?: SimpleStreamOptions["onPayload"];
    beforeToolCall?: (context: BeforeToolCallContext, signal?: AbortSignal) => Promise<BeforeToolCallResult | undefined>;
    afterToolCall?: (context: AfterToolCallContext, signal?: AbortSignal) => Promise<AfterToolCallResult | undefined>;
    private activeRun?;
    sessionId?: string;
    thinkingBudgets?: ThinkingBudgets;
    transport: Transport;
    maxRetryDelayMs?: number;
    toolExecution: ToolExecutionMode;
    constructor(options?: AgentOptions);
    /**
     * Subscribe to agent events
     */
    subscribe(listener: (event: AgentEvent, signal: AbortSignal) => Promise<void> | void): () => void;
    /**
     * Current state
     */
    get state(): AgentState;
    set steeringMode(mode: QueueMode);
    get steeringMode(): QueueMode;
    set followUpMode(mode: QueueMode);
    get followUpMode(): QueueMode;
    /**
     * Queue steering message
     */
    steer(message: AgentMessage): void;
    /**
     * Queue follow-up message
     */
    followUp(message: AgentMessage): void;
    clearSteeringQueue(): void;
    clearFollowUpQueue(): void;
    clearAllQueues(): void;
    hasQueuedMessages(): boolean;
    get signal(): AbortSignal | undefined;
    abort(): void;
    waitForIdle(): Promise<void>;
    reset(): void;
    prompt(message: AgentMessage | AgentMessage[]): Promise<void>;
    prompt(input: string, images?: ImageContent[]): Promise<void>;
    continue(): Promise<void>;
    private normalizePromptInput;
    private runPromptMessages;
    private runContinuation;
    private createContextSnapshot;
    private createLoopConfig;
    private runWithLifecycle;
    private handleRunFailure;
    private finishRun;
    private processEvents;
}
export {};
//# sourceMappingURL=agent.d.ts.map