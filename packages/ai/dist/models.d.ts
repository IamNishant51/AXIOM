/**
 * Model Registry - Manages available models and providers
 * Axiom AI
 */
import type { Model, Provider } from "./types.js";
declare const BUILT_IN_MODELS: Model<any>[];
export declare function initializeProviders(): void;
export declare function getProviders(): Provider[];
export declare function getModels(provider: string): Model<any>[];
export declare function getModel(provider: string, modelId: string): Model<any> | undefined;
export declare function registerModel(model: Model<any>): void;
export { BUILT_IN_MODELS };
//# sourceMappingURL=models.d.ts.map