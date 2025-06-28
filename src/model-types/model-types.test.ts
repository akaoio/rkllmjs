/**
 * Unit tests for model types
 */

import { describe, it, expect } from 'bun:test';
import type { ModelInfo, ModelConfig, ModelMetadata } from './model-types.js';

describe('ModelInfo', () => {
  it('should have required properties', () => {
    const modelInfo: ModelInfo = {
      name: 'test-model',
      path: '/path/to/model',
      size: 1024,
      created: new Date()
    };

    expect(modelInfo.name).toBe('test-model');
    expect(modelInfo.path).toBe('/path/to/model');
    expect(modelInfo.size).toBe(1024);
    expect(modelInfo.created).toBeInstanceOf(Date);
  });

  it('should support optional properties', () => {
    const modelInfo: ModelInfo = {
      name: 'test-model',
      path: '/path/to/model',
      size: 1024,
      created: new Date(),
      repo: 'user/repo',
      filename: 'model.rkllm'
    };

    expect(modelInfo.repo).toBe('user/repo');
    expect(modelInfo.filename).toBe('model.rkllm');
  });
});

describe('ModelConfig', () => {
  it('should support all optional properties', () => {
    const config: ModelConfig = {
      modelType: 'llama',
      vocabSize: 32000,
      hiddenSize: 768,
      numLayers: 12,
      numAttentionHeads: 12,
      maxSequenceLength: 2048
    };

    expect(config.modelType).toBe('llama');
    expect(config.vocabSize).toBe(32000);
    expect(config.hiddenSize).toBe(768);
    expect(config.numLayers).toBe(12);
    expect(config.numAttentionHeads).toBe(12);
    expect(config.maxSequenceLength).toBe(2048);
  });

  it('should allow empty config', () => {
    const config: ModelConfig = {};
    expect(Object.keys(config)).toHaveLength(0);
  });
});

describe('ModelMetadata', () => {
  it('should support version information', () => {
    const metadata: ModelMetadata = {
      version: '1.1.4',
      architecture: 'rk3588',
      quantization: 'w8a8',
      optimization: 'opt-0',
      hybridRatio: 0.0
    };

    expect(metadata.version).toBe('1.1.4');
    expect(metadata.architecture).toBe('rk3588');
    expect(metadata.quantization).toBe('w8a8');
    expect(metadata.optimization).toBe('opt-0');
    expect(metadata.hybridRatio).toBe(0.0);
  });
});
