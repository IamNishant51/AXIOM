/**
 * Validation utilities
 * Axiom AI
 */
/**
 * Validate tool arguments against schema
 * Simple validation - in production you'd use a proper validator
 */
export function validateToolArguments(tool, toolCall) {
    // For now, just return the arguments as-is
    // A proper implementation would use ajv or similar
    const args = toolCall.arguments;
    // Basic check - ensure it's an object
    if (args === null || args === undefined) {
        return {};
    }
    if (typeof args !== "object") {
        throw new Error(`Invalid arguments for ${tool.name}: expected object`);
    }
    return args;
}
//# sourceMappingURL=validation.js.map