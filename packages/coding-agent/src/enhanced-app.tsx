/**
 * EnhancedApp.tsx - Full Claude Code CLI Experience
 * Real-time streaming, collapsible thinking, tool display, status bar
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { setTheme, defaultTheme, useTheme } from "@axiom/tui-react";
import type { StatusState, Message } from "@axiom/tui-react";
import { StreamingResponse, StreamingThinking, ToolOutput, ToolChain, DiffView, MarkdownRenderer, PermissionDialog, StatusBar, VimInput } from "@axiom/tui-react";
import { createSettingsManager } from "./core/settings-manager.js";
import { createModelRegistry } from "./core/model-registry.js";
import { Agent } from "@axiom/agent-core";
import { defaultTools } from "./core/tools/index.js";
import type { AssistantMessage, TextContent, ThinkingContent } from "@axiom/ai";

// Set theme
setTheme(defaultTheme);

// Tool call interface
interface ToolCall {
	id: string;
	name: string;
	args: any;
	status: "pending" | "running" | "done" | "error";
	result?: string;
}

// Main Enhanced App Component
export const EnhancedApp: React.FC<{
	onMessage?: (message: string) => void;
	onExit?: () => void;
	initialPrompt?: string;
}> = ({ onMessage, onExit, initialPrompt }) => {
	const theme = useTheme();
	const { exit } = useApp();

	// Message state
	const [messages, setMessages] = useState<Message[]>([]);
	const [currentThinking, setCurrentThinking] = useState<string>("");
	const [currentContent, setCurrentContent] = useState<string>("");
	const [isStreaming, setIsStreaming] = useState(false);

	// Thinking expansion state
	const [showAllThinking, setShowAllThinking] = useState(false);
	const [expandedThinking, setExpandedThinking] = useState<Set<string>>(new Set());

	// Tool state
	const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
	const [currentToolCall, setCurrentToolCall] = useState<ToolCall | null>(null);

	// UI state
	const [aiState, setAiState] = useState<StatusState>("idle");
	const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("connected");
	const [inputValue, setInputValue] = useState("");
	const [inputMode, setInputMode] = useState<"normal" | "vim">("normal");

	// Agent ref
	const agentRef = useRef<any>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	// Initialize agent
	useEffect(() => {
		const settings = createSettingsManager();
		const modelRegistry = createModelRegistry(settings);
		const model = modelRegistry.getDefaultModel();
		const apiKey = modelRegistry.getApiKey(model?.provider || "opencode");

		if (!apiKey) {
			console.error("No API key found. Set OPENCODE_API_KEY.");
			process.exit(1);
		}

		agentRef.current = new Agent({
			initialState: {
				systemPrompt: "You are Axiom. Be concise. Complete tasks efficiently.",
				model,
				tools: defaultTools,
				messages: [],
			},
			getApiKey: async () => apiKey,
			toolExecution: "sequential",
		});

		// Subscribe to agent events
		agentRef.current.subscribe((event: any) => {
			switch (event.type) {
				case "thinking_start":
					setAiState("thinking");
					setCurrentThinking(event.thinking || "");
					break;

				case "thinking_update":
					setCurrentThinking(event.thinking || "");
					break;

				case "thinking_end":
					setCurrentThinking("");
					break;

				case "tool_execution_start":
					setAiState("working");
					const toolCall: ToolCall = {
						id: `tool-${Date.now()}`,
						name: event.toolName,
						args: event.args || {},
						status: "running",
					};
					setCurrentToolCall(toolCall);
					setToolCalls(prev => [...prev, toolCall]);
					break;

				case "tool_execution_end":
					setToolCalls(prev =>
						prev.map(tc =>
							tc.id === currentToolCall?.id
								? { ...tc, status: "done", result: event.result }
								: tc
						)
					);
					setCurrentToolCall(null);
					setAiState("thinking");
					break;

				case "text_delta":
					setCurrentContent(prev => prev + event.text);
					break;

				case "message_complete":
					setAiState("success");
					setTimeout(() => setAiState("idle"), 1500);
					break;

				case "error":
					setAiState("error");
					setTimeout(() => setAiState("idle"), 2000);
					break;
			}
		});

		// Initial prompt
		if (initialPrompt) {
			handleSubmit(initialPrompt);
		}
	}, []);

	// Toggle thinking expansion
	const toggleThinking = useCallback((msgId: string) => {
		setExpandedThinking(prev => {
			const next = new Set(prev);
			if (next.has(msgId)) {
				next.delete(msgId);
			} else {
				next.add(msgId);
			}
			return next;
		});
	}, []);

	// Keyboard shortcuts - use ref to avoid closure issues
	const inputModeRef = useRef(inputMode);
	inputModeRef.current = inputMode;

	useInput((input, key) => {
		// Ctrl+C to interrupt - only if not typing
		if (input === "c" && key.ctrl) {
			agentRef.current?.cancel?.();
			setIsStreaming(false);
			setAiState("idle");
			return;
		}

		// Tab to toggle thinking - only when not in vim mode and not typing
		if (key.tab && inputModeRef.current !== "vim" && !isStreaming) {
			setShowAllThinking(prev => !prev);
			return;
		}

		// Ctrl+V for vim mode
		if (input === "v" && key.ctrl) {
			setInputMode(prev => prev === "vim" ? "normal" : "vim");
			return;
		}

		// Escape to exit vim mode only
		if (key.escape && inputModeRef.current === "vim") {
			setInputMode("normal");
			return;
		}

		// Don't intercept arrow keys, backspace, or other typing keys
		// Let them pass through to child components
	});

	// Handle message submit
	const handleSubmit = useCallback(async (text: string) => {
		if (!text.trim() || !agentRef.current) return;

		// Add user message
		const userMsg: Message = {
			id: `user-${Date.now()}`,
			role: "user",
			content: text,
			timestamp: Date.now(),
		};
		setMessages(prev => [...prev, userMsg]);
		setInputValue("");
		setIsStreaming(true);
		setCurrentContent("");
		setCurrentThinking("");
		setToolCalls([]);

		// Create assistant message placeholder
		const assistantMsgId = `assistant-${Date.now()}`;

		try {
			await agentRef.current.prompt(text);

			// Get the last assistant message
			const allMessages = agentRef.current.state.messages;
			const assistantMsgs = allMessages.filter((m: any) => m.role === "assistant");
			const lastMsg = assistantMsgs[assistantMsgs.length - 1] as AssistantMessage;

			const textContent = lastMsg?.content?.find((c: any) => c.type === "text") as TextContent | undefined;
			const thinkingContent = lastMsg?.content?.find((c: any) => c.type === "thinking") as ThinkingContent | undefined;

			// Update with final content
			setMessages(prev => {
				const updated = [...prev];
				const assistantIndex = updated.findIndex(m => m.id === assistantMsgId);
				if (assistantIndex >= 0) {
					updated[assistantIndex] = {
						...updated[assistantIndex],
						content: textContent?.text || currentContent || "Completed",
						timestamp: Date.now(),
					};
				} else {
					updated.push({
						id: assistantMsgId,
						role: "assistant",
						content: textContent?.text || currentContent || "Completed",
						timestamp: Date.now(),
						thinking: thinkingContent?.thinking,
					});
				}
				return updated;
			});

		} catch (error) {
			console.error("Error:", error);
			setAiState("error");
		}

		setIsStreaming(false);
	}, [currentContent]);

	// Render thinking for a message
	const renderThinking = useCallback((msg: Message) => {
		if (!msg.thinking) return null;

		const isExpanded = showAllThinking || expandedThinking.has(msg.id);

		return (
			<Box flexDirection="column" marginBottom={1}>
				<Box flexDirection="row" alignItems="center">
					<Text color={theme.colors.secondary}>
						{isExpanded ? "▼" : "▶"}
					</Text>
					<Text color={theme.colors.textMuted}> </Text>
					<Text color={theme.colors.secondary} bold>Reasoning</Text>
					<Text color={theme.colors.textMuted}> </Text>
					<Text dimColor color={theme.colors.textMuted}>
						[Tab]
					</Text>
				</Box>
				{isExpanded && (
					<Box paddingLeft={2} flexDirection="column" marginTop={1}>
						<Text color={theme.colors.textDim} italic>
							{msg.thinking}
						</Text>
					</Box>
				)}
			</Box>
		);
	}, [showAllThinking, expandedThinking, theme]);

	// Render a message
	const renderMessage = useCallback((msg: Message) => {
		const isUser = msg.role === "user";

		return (
			<Box key={msg.id} flexDirection="column" marginBottom={2}>
				{/* Role indicator */}
				<Box flexDirection="row" alignItems="center">
					<Text bold color={isUser ? theme.colors.primary : theme.colors.accent}>
						{isUser ? "❯" : "○"}
					</Text>
					<Text color={theme.colors.textMuted}> </Text>
					<Text bold color={theme.colors.textDim}>
						{isUser ? "You" : "Axiom"}
					</Text>
				</Box>

				{/* Content */}
				<Box paddingLeft={2} flexDirection="column">
					{/* Thinking/Reasoning */}
					{!isUser && renderThinking(msg)}

					{/* Message content with markdown */}
					<MarkdownRenderer content={msg.content} />
				</Box>
			</Box>
		);
	}, [renderThinking, theme]);

	// Render history
	const renderHistory = () => {
		if (messages.length === 0) {
			return (
				<Box flexDirection="column" alignItems="center" justifyContent="center" paddingY={4}>
					<Text dimColor color={theme.colors.textMuted}>Type a message to start...</Text>
				</Box>
			);
		}

		return messages.map(msg => renderMessage(msg));
	};

	// Render current streaming content
	const renderStreamingContent = () => {
		if (!isStreaming && !currentContent) return null;

		return (
			<Box flexDirection="column" marginBottom={2}>
				{/* Role indicator */}
				<Box flexDirection="row" alignItems="center">
					<Text bold color={theme.colors.accent}>○</Text>
					<Text color={theme.colors.textMuted}> </Text>
					<Text bold color={theme.colors.textDim}>Axiom</Text>
					<Text color={theme.colors.textMuted}> </Text>
					<Text dimColor color={theme.colors.textMuted}>
						{isStreaming ? "Thinking..." : ""}
					</Text>
				</Box>

				<Box paddingLeft={2} flexDirection="column">
					{/* Thinking */}
					{currentThinking && (
						<StreamingThinking
							thinking={currentThinking}
							isStreaming={true}
							isExpanded={true}
						/>
					)}

					{/* Content */}
					<StreamingResponse
						initialContent={currentContent}
						isStreaming={isStreaming}
						showCursor={true}
					/>
				</Box>
			</Box>
		);
	};

	// Render tool chain
	const renderToolChain = () => {
		if (toolCalls.length === 0) return null;

		return (
			<Box marginTop={1}>
				<ToolChain tools={toolCalls} />
			</Box>
		);
	};

	// Simple input handler for normal mode
	const SimpleInput: React.FC = () => {
		const [value, setValue] = useState("");
		const valueRef = useRef("");

		// Keep ref in sync
		useEffect(() => {
			valueRef.current = value;
		}, [value]);

		useInput((input, key) => {
			// Handle backspace - comprehensive coverage
			if (key.backspace || key.delete || input === "\x7f" || input === "\b" || input === "⌫") {
				setValue(prev => {
					if (prev.length > 0) {
						return prev.slice(0, -1);
					}
					return prev;
				});
				return;
			}

			// Handle return/submit
			if (key.return) {
				if (valueRef.current.trim()) {
					handleSubmit(valueRef.current);
					setValue("");
				}
				return;
			}

			// Handle escape
			if (key.escape) {
				return;
			}

			// Regular character input - only printable characters
			if (input && input.length === 1 && !key.ctrl && !key.meta && !key.backspace && !key.delete) {
				const charCode = input.charCodeAt(0);
				// Only accept printable characters (space to tilde) and extended ASCII
				if ((charCode >= 32 && charCode <= 126) || charCode > 127) {
					setValue(prev => prev + input);
				}
			}
		});

		return (
			<Box flexDirection="row" alignItems="center">
				<Text bold color={theme.colors.primary}>❯</Text>
				<Text> </Text>
				<Text color={theme.colors.text}>{value}</Text>
				<Text color={theme.colors.cursor}>█</Text>
			</Box>
		);
	};

	return (
		<Box flexDirection="column" height="100%">
			{/* Header */}
			<Box flexDirection="row" justifyContent="space-between" marginBottom={1}>
				<Box flexDirection="row" alignItems="center">
					<Text bold color={theme.colors.primary}>▲</Text>
					<Text> </Text>
					<Text bold color={theme.colors.text}>Axiom</Text>
				</Box>
				<Box flexDirection="row" alignItems="center" gap={2}>
					<Text dimColor color={theme.colors.textMuted}>[Tab] reasoning</Text>
					<Text dimColor color={theme.colors.textMuted}>[Ctrl+V] vim</Text>
					<Text dimColor color={theme.colors.textMuted}>[Ctrl+C] stop</Text>
				</Box>
			</Box>

			{/* Divider */}
			<Box>
				<Text dimColor color={theme.colors.borderDim}>────────────────────────────────────────────────────────────────────────</Text>
			</Box>

			{/* Messages area */}
			<Box flexDirection="column" flexGrow={1} overflow="hidden">
				{renderHistory()}
				{renderStreamingContent()}
				{renderToolChain()}
			</Box>

			{/* Divider */}
			<Box>
				<Text dimColor color={theme.colors.borderDim}>────────────────────────────────────────────────────────────────────────</Text>
			</Box>

			{/* Status bar */}
			<StatusBar
				connectionStatus={connectionStatus}
				isProcessing={isStreaming}
				toolName={currentToolCall?.name}
			/>

			{/* Input */}
			<Box marginTop={1}>
				{inputMode === "vim" ? (
					<VimInput
						onSubmit={handleSubmit}
						placeholder="Message Axiom..."
						initialValue={inputValue}
					/>
				) : (
					<SimpleInput />
				)}
			</Box>
		</Box>
	);
};

export default EnhancedApp;