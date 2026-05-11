/**
 * Extensions module - Dynamic tool management
 */

export {
	ExtensionRegistry,
	getExtensionRegistry,
	createExtensionRegistry,
} from "./registry.js";
export type { ExtensionDefinition } from "./registry.js";

export {
	addExtensionTool,
	listExtensionsTool,
	removeExtensionTool,
	reloadExtensionsTool,
	getExtensionTool,
	extensionTools,
} from "./tools.js";

export { webSearchTool, fetchUrlTool, internetTools } from "./internet.js";