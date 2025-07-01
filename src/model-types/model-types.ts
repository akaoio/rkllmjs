/**
 * @module model-types
 * @purpose Type definitions for RKLLM model management and metadata
 * @description Provides TypeScript interfaces for model information, repository
 *              metadata, download progress tracking, and validation structures.
 *              Essential for type-safe model management operations.
 * @author RKLLMJS Team
 * @version 1.0.0
 */

/**
 * Type definitions for RKLLMJS model management tools
 */

export interface ModelInfo {
  name: string;
  path: string;
  size: number;
  created: Date;
  repo?: string;
  filename?: string;
}

export interface ModelConfig {
  modelType?: string;
  vocabSize?: number;
  hiddenSize?: number;
  numLayers?: number;
  numAttentionHeads?: number;
  maxSequenceLength?: number;
}

export interface ModelMetadata {
  version?: string;
  architecture?: string;
  quantization?: string;
  optimization?: string;
  hybridRatio?: number;
}
