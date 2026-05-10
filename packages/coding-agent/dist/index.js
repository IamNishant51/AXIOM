/**
 * Axiom Coding Agent
 * Main entry point
 */
import { main, parseArgs, printHelp } from "./cli.js";
// Get arguments
const args = process.argv.slice(2);
const options = parseArgs(args);
// Handle help (check manually since options.help may not exist)
if (args.includes("-h") || args.includes("--help")) {
    printHelp();
    process.exit(0);
}
// Run the CLI
main().catch(console.error);
//# sourceMappingURL=index.js.map