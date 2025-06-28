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
