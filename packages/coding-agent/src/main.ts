#!/usr/bin/env node
/**
 * Axiom CLI Entry Point
 * Terminal Coding Agent
 */

import { main } from "./cli.js";

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});