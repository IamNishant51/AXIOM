/**
 * Premium CLI - Using new EnhancedApp component
 * Matches Claude Code CLI look and feel
 */

import React from "react";
import { render } from "ink";
import { Agent, type AgentTool } from "@axiom/agent-core";
import { setTheme, defaultTheme } from "@axiom/tui-react";
import { EnhancedApp } from "./enhanced-app.js";
import { createSettingsManager } from "./core/settings-manager.js";
import { createModelRegistry } from "./core/model-registry.js";
import { createExtensionRegistry, getExtensionRegistry, extensionTools } from "./core/extensions/index.js";
import { internetTools } from "./core/extensions/internet.js";
import { defaultTools } from "./core/tools/index.js";
import * as path from "node:path";

// Use premium dark theme
setTheme(defaultTheme);

const MINIMAL_SYSTEM_PROMPT = `You are Axiom, a powerful coding assistant with tools to help you.

Built-in tools:
- read, write, edit, bash, grep, find, ls, mkdir

Internet tools:
- web_search: Search the internet
- fetch_url: Get content from a URL

Extension tools:
- add_extension: Add a new custom tool
- list_extensions: See all extensions
- remove_extension: Remove an extension

Use tools when needed to complete tasks.`;

// Main wrapper component that handles TTY detection
const AxiomWrapper: React.FC<{ initialPrompt?: string }> = ({ initialPrompt }) => {
	return <EnhancedApp initialPrompt={initialPrompt} />;
};

// Non-TTY simple version
async function runSimple(prompt: string): Promise<void> {
	console.log("╭────────────────────────────────────────────────────────────╮");
	console.log("│  🤖 Axiom v0.1.0                                         │");
	console.log("╰────────────────────────────────────────────────────────────╯\n");

	const settings = createSettingsManager();
	const modelRegistry = createModelRegistry(settings);
	const model = modelRegistry.getDefaultModel();
	const apiKey = modelRegistry.getApiKey(model?.provider || "opencode");

	if (!apiKey) {
		console.error("Error: No API key. Set OPENCODE_API_KEY.");
		process.exit(1);
	}

	// Initialize extension registry
	const extensionsDir = path.join(
		settings.getConfigDir().replace("/agent", ""),
		"extensions",
	);
	createExtensionRegistry(extensionsDir);
	const registry = getExtensionRegistry();
	await registry.loadAllExtensions();

	// Combine all tools
	const allTools = [...defaultTools, ...extensionTools, ...internetTools, ...registry.getAllTools()];

	const toolEvents: string[] = [];
	const agent = new Agent({
		initialState: {
			systemPrompt: MINIMAL_SYSTEM_PROMPT,
			model,
			tools: allTools,
			messages: [],
		},
		getApiKey: async () => apiKey,
		toolExecution: "sequential",
	});

	// Subscribe to extension changes
	registry.onToolsChange((newTools: AgentTool[]) => {
		agent.state.tools = [...defaultTools, ...extensionTools, ...internetTools, ...newTools];
	});

	agent.subscribe((event: any) => {
		if (event.type === "tool_execution_start") toolEvents.push(`[Running ${event.toolName}...]`);
		if (event.type === "tool_execution_end") toolEvents.push(`[${event.toolName} done]`);
	});

	console.log("🤖 Thinking...\n");

	const startTime = Date.now();
	await agent.prompt(prompt);
	const elapsed = Date.now() - startTime;

	if (toolEvents.length > 0) {
		console.log(toolEvents.join("\n"), "\n");
	}

	const allMessages = agent.state.messages;
	const assistantMsgs = allMessages.filter((m: any) => m.role === "assistant");
	const lastMsg = assistantMsgs[assistantMsgs.length - 1] as any;
	const text = lastMsg?.content?.find((c: any) => c.type === "text");

	console.log(text?.text || "");

	let totalTokens = 0;
	for (const m of allMessages as any[]) {
		if (m.usage?.totalTokens) totalTokens += m.usage.totalTokens;
	}
	console.log(`\n⏱ ${elapsed}ms | 💰 ${totalTokens} tokens`);
}

export async function runPremiumCli(prompt?: string): Promise<void> {
	const isTTY = process.stdin.isTTY;

	if (!isTTY) {
		if (!prompt) {
			console.log("Usage: axiom \"prompt\"");
			process.exit(1);
		}
		await runSimple(prompt);
		return;
	}

	render(<AxiomWrapper initialPrompt={prompt} />);
}