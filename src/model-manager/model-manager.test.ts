/**
 * Unit tests for RKLLM Model Manager
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { RKLLMModelManager } from './model-manager.js';
import * as fs from 'fs';
import * as path from 'path';

const TEST_MODELS_DIR = './tmp/test-models';

describe('RKLLMModelManager', () => {
  let manager: RKLLMModelManager;

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_MODELS_DIR)) {
      fs.rmSync(TEST_MODELS_DIR, { recursive: true, force: true });
    }
    manager = new RKLLMModelManager(TEST_MODELS_DIR);
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_MODELS_DIR)) {
      fs.rmSync(TEST_MODELS_DIR, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should create models directory if it does not exist', () => {
      expect(fs.existsSync(TEST_MODELS_DIR)).toBe(true);
    });

    it('should use default models directory', () => {
      const defaultManager = new RKLLMModelManager();
      expect(defaultManager).toBeInstanceOf(RKLLMModelManager);
    });
  });

  describe('listModels', () => {
    it('should return empty array when no models exist', async () => {
      const models = await manager.listModels();
      expect(models).toEqual([]);
    });

    it('should find models in subdirectories', async () => {
      // Create test model structure
      const testRepo = 'test/repo';
      const testModelDir = path.join(TEST_MODELS_DIR, testRepo);
      fs.mkdirSync(testModelDir, { recursive: true });
      
      const testModelFile = path.join(testModelDir, 'test-model.rkllm');
      fs.writeFileSync(testModelFile, 'dummy model content');
      
      const models = await manager.listModels();
      expect(models).toHaveLength(1);
      expect(models[0].name).toBe('test-model');
      expect(models[0].repo).toBe(testRepo);
      expect(models[0].filename).toBe('test-model.rkllm');
    });
  });

  describe('showModelInfo', () => {
    it('should handle non-existent model gracefully', async () => {
      // Should not throw error
      await expect(manager.showModelInfo('non-existent')).resolves.toBeUndefined();
    });
  });

  describe('removeModel', () => {
    it('should handle non-existent model gracefully', async () => {
      // Should not throw error
      await expect(manager.removeModel('non-existent')).resolves.toBeUndefined();
    });
  });

  describe('cleanModels', () => {
    it('should handle empty models directory', async () => {
      // Should not throw error
      await expect(manager.cleanModels()).resolves.toBeUndefined();
    });

    it('should clean all models', async () => {
      // Create test model
      const testRepo = 'test/repo';
      const testModelDir = path.join(TEST_MODELS_DIR, testRepo);
      fs.mkdirSync(testModelDir, { recursive: true });
      fs.writeFileSync(path.join(testModelDir, 'test.rkllm'), 'content');

      await manager.cleanModels();
      
      const models = await manager.listModels();
      expect(models).toHaveLength(0);
    });
  });

  describe('pullModel', () => {
    it('should handle network errors gracefully', async () => {
      // Test with invalid repo/model
      await expect(
        manager.pullModel('invalid/repo', 'invalid.rkllm')
      ).rejects.toThrow();
    });
  });
});
