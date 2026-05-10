/**
 * Validation utilities
 * Axiom AI
 */
import type { TSchema } from "@sinclair/typebox";
/**
 * Validate tool arguments against schema
 * Simple validation - in production you'd use a proper validator
 */
export declare function validateToolArguments<T extends TSchema>(tool: {
    name: string;
    parameters: T;
}, toolCall: {
    name: string;
    arguments: unknown;
}): unknown;
//# sourceMappingURL=validation.d.ts.map