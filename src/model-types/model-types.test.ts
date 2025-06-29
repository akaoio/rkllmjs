/**
 * Unit tests for model types
 * Node.js implementation with structured logging
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TestLogger } from '../testing/index.js';
import type { ModelInfo, ModelConfig, ModelMetadata } from './model-types.js';

const logger = TestLogger.createLogger('model-types');

describe('ModelInfo', () => {
  it('should have required properties', () => {
    const startTime = Date.now();
    logger.testStart('should have required properties');

    const modelInfo: ModelInfo = {
      name: 'test-model',
      path: '/path/to/model',
      size: 1024,
      created: new Date(),
    };

    logger.debug('Testing ModelInfo properties', { modelInfo });

    assert.strictEqual(modelInfo.name, 'test-model');
    assert.strictEqual(modelInfo.path, '/path/to/model');
    assert.strictEqual(modelInfo.size, 1024);
    assert.ok(modelInfo.created instanceof Date);

    const duration = Date.now() - startTime;
    logger.testEnd('should have required properties', true, duration);
  });

  it('should support optional properties', () => {
    const startTime = Date.now();
    logger.testStart('should support optional properties');

    const modelInfo: ModelInfo = {
      name: 'test-model',
      path: '/path/to/model',
      size: 1024,
      created: new Date(),
      repo: 'user/repo',
      filename: 'model.rkllm',
    };

    logger.debug('Testing optional ModelInfo properties', {
      repo: modelInfo.repo,
      filename: modelInfo.filename,
    });

    assert.strictEqual(modelInfo.repo, 'user/repo');
    assert.strictEqual(modelInfo.filename, 'model.rkllm');

    const duration = Date.now() - startTime;
    logger.testEnd('should support optional properties', true, duration);
  });
});

describe('ModelConfig', () => {
  it('should support all optional properties', () => {
    const startTime = Date.now();
    logger.testStart('should support all optional properties');

    const config: ModelConfig = {
      modelType: 'llama',
      vocabSize: 32000,
      hiddenSize: 768,
      numLayers: 12,
      numAttentionHeads: 12,
      maxSequenceLength: 2048,
    };

    logger.debug('Testing ModelConfig properties', { config });

    assert.strictEqual(config.modelType, 'llama');
    assert.strictEqual(config.vocabSize, 32000);
    assert.strictEqual(config.hiddenSize, 768);
    assert.strictEqual(config.numLayers, 12);
    assert.strictEqual(config.numAttentionHeads, 12);
    assert.strictEqual(config.maxSequenceLength, 2048);

    const duration = Date.now() - startTime;
    logger.testEnd('should support all optional properties', true, duration);
  });

  it('should allow empty config', () => {
    const startTime = Date.now();
    logger.testStart('should allow empty config');

    const config: ModelConfig = {};

    logger.debug('Testing empty ModelConfig', { config });
    assert.strictEqual(Object.keys(config).length, 0);

    const duration = Date.now() - startTime;
    logger.testEnd('should allow empty config', true, duration);
  });
});

describe('ModelMetadata', () => {
  it('should support version information', () => {
    const startTime = Date.now();
    logger.testStart('should support version information');

    const metadata: ModelMetadata = {
      version: '1.1.4',
      architecture: 'rk3588',
      quantization: 'w8a8',
      optimization: 'opt-0',
      hybridRatio: 0.0,
    };

    logger.debug('Testing ModelMetadata properties', { metadata });

    assert.strictEqual(metadata.version, '1.1.4');
    assert.strictEqual(metadata.architecture, 'rk3588');
    assert.strictEqual(metadata.quantization, 'w8a8');
    assert.strictEqual(metadata.optimization, 'opt-0');
    assert.strictEqual(metadata.hybridRatio, 0.0);

    const duration = Date.now() - startTime;
    logger.testEnd('should support version information', true, duration);
  });
});

// Test run summary - moved to avoid conflicts with Node.js test runner
logger.summary();
