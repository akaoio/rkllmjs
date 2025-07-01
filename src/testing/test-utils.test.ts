/**
 * Test Utilities Tests
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  areNativeBindingsAvailable,
  requireNativeBindings,
  getTestModelPath,
  isCompatibleHardware,
  PRODUCTION_TEST_CONFIG,
  PRODUCTION_TEST_PROMPTS,
} from './test-utils.js';

describe('Test Utilities', () => {
  test('should check native bindings availability', () => {
    const isAvailable = areNativeBindingsAvailable();
    assert.ok(typeof isAvailable === 'boolean');
    // On development environments, bindings may not be available
    console.log(`Native bindings available: ${isAvailable}`);
  });

  test('should handle requireNativeBindings gracefully', () => {
    // Should not throw errors regardless of binding availability
    const result = requireNativeBindings();
    assert.ok(typeof result === 'boolean');
  });

  test('should provide test model path handling', () => {
    try {
      getTestModelPath();
    } catch (error) {
      // Expected to fail in development without model files
      assert.ok(error instanceof Error);
      assert.ok(error.message.includes('Test model not found'));
    }
  });

  test('should check hardware compatibility', () => {
    const isCompatible = isCompatibleHardware();
    assert.ok(typeof isCompatible === 'boolean');
    console.log(`Hardware compatible: ${isCompatible}`);
  });

  test('should provide production test configuration', () => {
    assert.ok(typeof PRODUCTION_TEST_CONFIG === 'object');
    assert.ok(typeof PRODUCTION_TEST_CONFIG.maxContextLen === 'number');
    assert.ok(typeof PRODUCTION_TEST_CONFIG.maxNewTokens === 'number');
    assert.ok(typeof PRODUCTION_TEST_CONFIG.topK === 'number');
    assert.ok(typeof PRODUCTION_TEST_CONFIG.topP === 'number');
    assert.ok(typeof PRODUCTION_TEST_CONFIG.temperature === 'number');
    assert.ok(typeof PRODUCTION_TEST_CONFIG.repeatPenalty === 'number');
    assert.ok(typeof PRODUCTION_TEST_CONFIG.cpuMask === 'number');
    assert.ok(typeof PRODUCTION_TEST_CONFIG.isAsync === 'boolean');
    assert.ok(typeof PRODUCTION_TEST_CONFIG.enableProfiler === 'boolean');
  });

  test('should provide production test prompts', () => {
    assert.ok(Array.isArray(PRODUCTION_TEST_PROMPTS));
    assert.ok(PRODUCTION_TEST_PROMPTS.length > 0);

    for (const prompt of PRODUCTION_TEST_PROMPTS) {
      assert.ok(typeof prompt === 'string');
      assert.ok(prompt.length > 0);
    }
  });

  test('should have valid configuration values', () => {
    // Validate configuration is reasonable for production
    assert.ok(PRODUCTION_TEST_CONFIG.maxContextLen > 0);
    assert.ok(PRODUCTION_TEST_CONFIG.maxNewTokens > 0);
    assert.ok(PRODUCTION_TEST_CONFIG.topK > 0);
    assert.ok(PRODUCTION_TEST_CONFIG.topP > 0 && PRODUCTION_TEST_CONFIG.topP <= 1);
    assert.ok(PRODUCTION_TEST_CONFIG.temperature >= 0);
    assert.ok(PRODUCTION_TEST_CONFIG.repeatPenalty > 0);
    assert.ok(PRODUCTION_TEST_CONFIG.cpuMask > 0);
  });
});
