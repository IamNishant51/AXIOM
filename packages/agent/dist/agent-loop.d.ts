/**
 * Agent Loop - Core agent runtime
 * Axiom Agent Core
 */
import { EventStream } from "@axiom/ai";
import type { AgentContext, AgentEvent, AgentLoopConfig, AgentMessage, StreamFn } from "./types.js";
export type AgentEventSink = (event: AgentEvent) => Promise<void> | void;
/**
 * Start an agent loop with a new prompt
 */
export declare function agentLoop(prompts: AgentMessage[], context: AgentContext, config: AgentLoopConfig, signal?: AbortSignal, streamFn?: StreamFn): EventStream<AgentEvent, AgentMessage[]>;
/**
 * Continue from existing context
 */
export declare function agentLoopContinue(context: AgentContext, config: AgentLoopConfig, signal?: AbortSignal, streamFn?: StreamFn): EventStream<AgentEvent, AgentMessage[]>;
export declare function runAgentLoop(prompts: AgentMessage[], context: AgentContext, config: AgentLoopConfig, emit: AgentEventSink, signal?: AbortSignal, streamFn?: StreamFn): Promise<AgentMessage[]>;
export declare function runAgentLoopContinue(context: AgentContext, config: AgentLoopConfig, emit: AgentEventSink, signal?: AbortSignal, streamFn?: StreamFn): Promise<AgentMessage[]>;
//# sourceMappingURL=agent-loop.d.ts.map