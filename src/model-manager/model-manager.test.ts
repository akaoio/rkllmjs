/**
 * Unit tests for RKLLM Model Manager
 * Node.js implementation with structured logging
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { TestLogger, getTestModelPath } from '../testing/index.js';
import { RKLLMModelManager } from './model-manager.js';
import * as fs from 'fs';
import * as path from 'path';

const logger = TestLogger.createLogger('model-manager');
const TEST_MODELS_DIR = './tmp/test-models';

describe('RKLLMModelManager', () => {
  let manager: RKLLMModelManager;

  beforeEach(() => {
    logger.testStart('beforeEach setup');

    // Clean up test directory
    if (fs.existsSync(TEST_MODELS_DIR)) {
      fs.rmSync(TEST_MODELS_DIR, { recursive: true, force: true });
    }
    manager = new RKLLMModelManager(TEST_MODELS_DIR);

    logger.info('Test setup completed', { testDir: TEST_MODELS_DIR });
  });

  afterEach(() => {
    logger.testStart('afterEach cleanup');

    // Clean up test directory
    if (fs.existsSync(TEST_MODELS_DIR)) {
      fs.rmSync(TEST_MODELS_DIR, { recursive: true, force: true });
    }

    logger.info('Test cleanup completed');
  });

  describe('constructor', () => {
    it('should create models directory if it does not exist', () => {
      const startTime = Date.now();
      logger.testStart('should create models directory if it does not exist');

      const dirExists = fs.existsSync(TEST_MODELS_DIR);
      logger.debug('Directory existence check', { dirExists, path: TEST_MODELS_DIR });

      assert.strictEqual(dirExists, true);

      const duration = Date.now() - startTime;
      logger.testEnd('should create models directory if it does not exist', true, duration);
    });

    it('should use default models directory', () => {
      const startTime = Date.now();
      logger.testStart('should use default models directory');

      const defaultManager = new RKLLMModelManager();
      logger.debug('Default manager created', {
        isInstance: defaultManager instanceof RKLLMModelManager,
      });

      assert.ok(defaultManager instanceof RKLLMModelManager);

      const duration = Date.now() - startTime;
      logger.testEnd('should use default models directory', true, duration);
    });
  });

  describe('listModels', () => {
    it('should return empty array when no models exist', async () => {
      const startTime = Date.now();
      logger.testStart('should return empty array when no models exist');

      const models = await manager.listModels();
      logger.debug('Models found', { count: models.length, models });

      assert.deepStrictEqual(models, []);

      const duration = Date.now() - startTime;
      logger.testEnd('should return empty array when no models exist', true, duration);
    });

    it('should find models in subdirectories', async () => {
      const startTime = Date.now();
      logger.testStart('should find models in subdirectories');

      try {
        // Try to use real model first
        const realModelPath = getTestModelPath();
        logger.info('Using real model for test', { modelPath: realModelPath });
        
        // Use real model
        const models = await manager.listModels();
        logger.debug('Models found with real model', {
          count: models.length,
          models,
        });

        // If we have real models from download, test with those
        if (models.length > 0) {
          assert.ok(models.length >= 1);
          assert.ok(models[0], 'Expected models[0] to be defined');
          assert.ok(models[0]?.name);
          assert.ok(models[0]?.repo);
          assert.ok(models[0]?.filename?.endsWith('.rkllm'));
        } else {
          // Fallback: Create test model structure using real model name
          const testRepo = 'test/repo';
          const testModelDir = path.join(TEST_MODELS_DIR, testRepo);
          fs.mkdirSync(testModelDir, { recursive: true });
          
          // Copy or link the real model
          const realModelName = path.basename(realModelPath);
          const testModelPath = path.join(testModelDir, realModelName);
          
          try {
            // Try to create a hard link to save space
            fs.linkSync(realModelPath, testModelPath);
          } catch {
            // If linking fails, copy the file
            fs.copyFileSync(realModelPath, testModelPath);
          }

          const modelsAfterSetup = await manager.listModels();
          logger.debug('Models found after creating test structure with real model', {
            count: modelsAfterSetup.length,
            models: modelsAfterSetup,
            testRepo,
            testModelDir,
          });

          assert.strictEqual(modelsAfterSetup.length, 1);
          assert.ok(modelsAfterSetup[0], 'Expected models[0] to be defined');
          assert.strictEqual(modelsAfterSetup[0]?.name, realModelName.replace('.rkllm', ''));
          assert.strictEqual(modelsAfterSetup[0]?.repo, testRepo);
          assert.strictEqual(modelsAfterSetup[0]?.filename, realModelName);
        }
      } catch (error) {
        // If no real model available, skip this test
        if (error instanceof Error && error.message.includes('Test model not found')) {
          logger.info('Skipping test - no real model available');
          logger.info('To enable this test, download a model first: npm run cli pull dulimov/Qwen2.5-VL-7B-Instruct-rk3588-1.2.1 Qwen2.5-VL-7B-Instruct-rk3588-w8a8-opt-1-hybrid-ratio-0.5.rkllm');
        } else {
          throw error;
        }
      }

      const duration = Date.now() - startTime;
      logger.testEnd('should find models in subdirectories', true, duration);
    });
  });

  describe('showModelInfo', () => {
    it('should handle non-existent model gracefully', async () => {
      const startTime = Date.now();
      logger.testStart('should handle non-existent model gracefully');

      const result = await manager.showModelInfo('non-existent');
      logger.debug('showModelInfo result for non-existent model', { result });

      assert.strictEqual(result, undefined);

      const duration = Date.now() - startTime;
      logger.testEnd('should handle non-existent model gracefully', true, duration);
    });
  });

  describe('removeModel', () => {
    it('should handle non-existent model gracefully', async () => {
      const startTime = Date.now();
      logger.testStart('should handle non-existent model gracefully');

      const result = await manager.removeModel('non-existent');
      logger.debug('removeModel result for non-existent model', { result });

      assert.strictEqual(result, undefined);

      const duration = Date.now() - startTime;
      logger.testEnd('should handle non-existent model gracefully', true, duration);
    });
  });

  describe('cleanModels', () => {
    it('should clean models directory', async () => {
      const startTime = Date.now();
      logger.testStart('should clean models directory');

      const result = await manager.cleanModels();
      logger.debug('cleanModels result', { result });

      assert.strictEqual(result, undefined);

      const duration = Date.now() - startTime;
      logger.testEnd('should clean models directory', true, duration);
    });
  });

  describe('error handling', () => {
    it('should handle empty models directory', async () => {
      const startTime = Date.now();
      logger.testStart('should handle empty models directory');

      // Remove the test directory to simulate empty state
      if (fs.existsSync(TEST_MODELS_DIR)) {
        fs.rmSync(TEST_MODELS_DIR, { recursive: true, force: true });
      }

      const models = await manager.listModels();
      logger.debug('Models found in empty directory', { count: models.length });

      assert.strictEqual(models.length, 0);

      const duration = Date.now() - startTime;
      logger.testEnd('should handle empty models directory', true, duration);
    });

    // Note: pullModel test is commented out as it would involve external dependencies
    // This should be moved to integration tests
  });

  // Test run summary - moved to avoid conflicts with Node.js test runner
  logger.summary();
});
