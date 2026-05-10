#!/usr/bin/env node
/**
 * Axiom CLI Entry Point
 * Terminal Coding Agent - Premium TUI Version
 */

import process from "node:process";

// Parse args
const args = process.argv.slice(2);
let prompt: string | undefined;

for (let i = 0; i < args.length; i++) {
	const arg = args[i];
	if (arg === "-h" || arg === "--help") {
		console.log(`
Axiom - Terminal Coding Agent

Usage:
  axiom                    # Interactive mode
  axiom "prompt"           # Single prompt
  axiom -c                # Continue last session
  axiom -h, --help        # Show help

Environment:
  OPENCODE_API_KEY        Your OpenCode API key
`);
		process.exit(0);
	} else if (arg === "-c" || arg === "--continue") {
		// TODO: Resume session
		console.log("Session resume not yet implemented");
		process.exit(0);
	} else if (!arg.startsWith("-")) {
		prompt = arg;
	}
}

// Import premium CLI
const { runPremiumCli } = await import("./premium-cli.js");

// Run the premium CLI
runPremiumCli(prompt).catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});