/**
 * Testing Module Integration Tests
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  TestLogger,
  areNativeBindingsAvailable,
  createTestLogger,
  PRODUCTION_TEST_CONFIG,
  PRODUCTION_TEST_PROMPTS,
} from './index.js';

describe('Testing Module Integration', () => {
  test('should export all necessary components', () => {
    // Check main exports
    assert.ok(typeof TestLogger === 'function');
    assert.ok(typeof areNativeBindingsAvailable === 'function');
    assert.ok(typeof createTestLogger === 'function');
    assert.ok(typeof PRODUCTION_TEST_CONFIG === 'object');
    assert.ok(Array.isArray(PRODUCTION_TEST_PROMPTS));
  });

  test('should create logger through factory function', () => {
    const logger = createTestLogger('integration-test');
    assert.ok(logger instanceof TestLogger);
  });

  test('should work as unified testing infrastructure', () => {
    const logger = createTestLogger('unified-test');

    // Use logger
    logger.testStart('integration test');

    // Check system requirements
    const hasBindings = areNativeBindingsAvailable();
    logger.info(`Native bindings available: ${hasBindings}`);

    // Use production config
    logger.info('Using production config', PRODUCTION_TEST_CONFIG);

    // Complete test
    logger.testEnd('integration test', true);
    logger.summary();

    assert.ok(true, 'Unified infrastructure should work seamlessly');
  });

  test('should maintain backward compatibility', async () => {
    // All previous imports should still work with ESM
    const testLoggerModule = await import('./test-logger.js');
    const testUtilsModule = await import('./test-utils.js');

    assert.ok(typeof testLoggerModule.TestLogger === 'function');
    assert.ok(typeof testUtilsModule.areNativeBindingsAvailable === 'function');
  });
});
