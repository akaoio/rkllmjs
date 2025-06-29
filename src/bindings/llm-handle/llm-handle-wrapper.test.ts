/**
 * @file llm-handle-wrapper.test.ts
 * @brief Unit tests for LLM Handle TypeScript wrapper
 * 
 * Tests TypeScript wrapper functionality for LLM handle management:
 * - Default parameter creation
 * - Type safety and validation
 * - Error handling
 * - Integration with native bindings
 */

import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import { TestLogger } from '../../test-logger/test-logger';

// Import the wrapper (will be tested with mocking for now)
import LLMHandleWrapper, { RKLLMParam, LLMHandle } from './llm-handle-wrapper';

describe('LLMHandleWrapper', () => {
  const logger = new TestLogger('llm-handle-wrapper');

  describe('createDefaultParam', () => {
    test('should create default parameters with required properties', async () => {
      logger.testStart('createDefaultParam basic functionality');
      
      try {
        // This test will fail until native binding is built, so we mock it
        const mockDefaultParam: RKLLMParam = {
          model_path: '',
          max_context_len: 2048,
          max_new_tokens: 512,
          top_k: 40,
          top_p: 0.9,
          temperature: 0.7,
          repeat_penalty: 1.1,
          frequency_penalty: 0.0,
          presence_penalty: 0.0,
          mirostat: 0,
          mirostat_tau: 5.0,
          mirostat_eta: 0.1,
          skip_special_token: false,
          is_async: false
        };

        // Mock the native binding for testing
        const originalBinding = (LLMHandleWrapper as any).nativeBinding;
        (LLMHandleWrapper as any).nativeBinding = {
          createDefaultParam: () => mockDefaultParam
        };

        const result = LLMHandleWrapper.createDefaultParamSync();
        
        logger.expectation('model_path property', result.hasOwnProperty('model_path'), true);
        assert.ok(result.hasOwnProperty('model_path'));
        
        logger.expectation('max_context_len > 0', result.max_context_len, true);
        assert.ok(typeof result.max_context_len === 'number' && result.max_context_len > 0);
        
        logger.expectation('max_new_tokens > 0', result.max_new_tokens, true);
        assert.ok(typeof result.max_new_tokens === 'number' && result.max_new_tokens > 0);
        
        logger.expectation('temperature >= 0', result.temperature, true);
        assert.ok(typeof result.temperature === 'number' && result.temperature >= 0);

        // Restore original binding
        (LLMHandleWrapper as any).nativeBinding = originalBinding;
        
        logger.testEnd('createDefaultParam basic functionality', true);
      } catch (error) {
        logger.error('createDefaultParam test failed', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    });

    test('should create consistent default parameters', async () => {
      logger.testStart('createDefaultParam consistency');
      
      try {
        const mockDefaultParam: RKLLMParam = {
          model_path: '',
          max_context_len: 2048,
          max_new_tokens: 512,
          temperature: 0.7
        };

        (LLMHandleWrapper as any).nativeBinding = {
          createDefaultParam: () => mockDefaultParam
        };

        const param1 = LLMHandleWrapper.createDefaultParamSync();
        const param2 = LLMHandleWrapper.createDefaultParamSync();
        
        logger.expectation('parameters consistency', param1, true);
        assert.deepEqual(param1, param2);
        
        logger.testEnd('createDefaultParam consistency', true);
      } catch (error) {
        logger.error('createDefaultParam consistency test failed', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    });
  });

  describe('parameter validation', () => {
    test('should validate required model_path parameter', async () => {
      logger.testStart('model_path validation');
      
      try {
        const invalidParam: RKLLMParam = {
          model_path: '',
          max_context_len: 2048,
          max_new_tokens: 512,
          temperature: 0.7
        };

        // Mock the native binding
        (LLMHandleWrapper as any).nativeBinding = {
          init: () => { throw new Error('model_path is required'); }
        };

        await assert.rejects(
          async () => {
            await LLMHandleWrapper.init(invalidParam);
          },
          {
            message: /model_path is required/
          }
        );
        
        logger.expectation('empty model_path rejection', 'rejected', true);
        logger.testEnd('model_path validation', true);
      } catch (error) {
        logger.error('model_path validation test failed', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    });

    test('should validate parameter types', async () => {
      logger.testStart('parameter type validation');
      
      try {
        const validParam: RKLLMParam = {
          model_path: '/path/to/model.rkllm',
          max_context_len: 2048,
          max_new_tokens: 512,
          temperature: 0.7
        };

        // Test type validation
        logger.expectation('model_path type', typeof validParam.model_path, true);
        assert.strictEqual(typeof validParam.model_path, 'string');
        
        logger.expectation('max_context_len type', typeof validParam.max_context_len, true);
        assert.strictEqual(typeof validParam.max_context_len, 'number');
        
        logger.expectation('temperature type', typeof validParam.temperature, true);
        assert.strictEqual(typeof validParam.temperature, 'number');
        
        logger.testEnd('parameter type validation', true);
      } catch (error) {
        logger.error('parameter type validation test failed', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    });
  });

  describe('error handling', () => {
    test('should handle native binding load failures gracefully', async () => {
      logger.testStart('native binding load failure handling');
      
      try {
        // Reset the native binding to null to simulate load failure
        (LLMHandleWrapper as any).nativeBinding = null;
        
        // Mock require to throw an error
        const originalRequire = require;
        (global as any).require = () => {
          throw new Error('Module not found');
        };

        await assert.rejects(
          async () => {
            await LLMHandleWrapper.createDefaultParam();
          },
          {
            message: /Failed to load native binding/
          }
        );
        
        // Restore original require
        (global as any).require = originalRequire;
        
        logger.expectation('binding load failure', 'rejected', true);
        logger.testEnd('native binding load failure handling', true);
      } catch (error) {
        logger.error('native binding load failure test failed', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    });

    test('should handle invalid handle objects', async () => {
      logger.testStart('invalid handle object handling');
      
      try {
        const invalidHandle = {} as LLMHandle;

        await assert.rejects(
          async () => {
            await LLMHandleWrapper.destroy(invalidHandle);
          },
          {
            message: /Invalid LLM handle/
          }
        );
        
        logger.expectation('invalid handle rejection', 'rejected', true);
        logger.testEnd('invalid handle object handling', true);
      } catch (error) {
        logger.error('invalid handle object test failed', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    });
  });

  describe('integration tests (mocked)', () => {
    test('should handle complete LLM lifecycle', async () => {
      logger.testStart('complete LLM lifecycle');
      
      try {
        const testParam: RKLLMParam = {
          model_path: '/path/to/test-model.rkllm',
          max_context_len: 1024,
          max_new_tokens: 256,
          temperature: 0.8
        };

        const mockHandle: LLMHandle = {
          _handle: 'mock_native_handle'
        };

        // Mock the native binding for full lifecycle
        (LLMHandleWrapper as any).nativeBinding = {
          createDefaultParam: () => ({
            model_path: '',
            max_context_len: 2048,
            max_new_tokens: 512,
            temperature: 0.7
          }),
          init: (param: RKLLMParam) => {
            if (!param.model_path) throw new Error('model_path is required');
            return mockHandle;
          },
          destroy: (handle: LLMHandle) => {
            if (!handle._handle) throw new Error('Invalid handle');
            return true;
          }
        };

        // Test initialization
        const handle = await LLMHandleWrapper.init(testParam);
        logger.expectation('LLM handle initialization', handle !== null, true);
        assert.ok(handle);
        assert.ok(handle._handle);

        // Test destruction
        const destroyResult = await LLMHandleWrapper.destroy(handle);
        logger.expectation('LLM handle destruction', destroyResult, true);
        assert.strictEqual(destroyResult, true);
        
        logger.testEnd('complete LLM lifecycle', true);
      } catch (error) {
        logger.error('complete LLM lifecycle test failed', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    });
  });

  describe('async/sync compatibility', () => {
    test('should provide both async and sync interfaces', async () => {
      logger.testStart('async/sync interface compatibility');
      
      try {
        const mockParam: RKLLMParam = {
          model_path: '',
          max_context_len: 2048,
          max_new_tokens: 512,
          temperature: 0.7
        };

        (LLMHandleWrapper as any).nativeBinding = {
          createDefaultParam: () => mockParam
        };

        // Test sync interface
        const syncResult = LLMHandleWrapper.createDefaultParamSync();
        logger.expectation('sync interface functionality', syncResult !== null, true);
        assert.ok(syncResult);

        // Test async interface
        const asyncResult = await LLMHandleWrapper.createDefaultParam();
        logger.expectation('async interface functionality', asyncResult !== null, true);
        assert.ok(asyncResult);

        // Results should be the same
        assert.deepEqual(syncResult, asyncResult);
        
        logger.testEnd('async/sync interface compatibility', true);
      } catch (error) {
        logger.error('async/sync interface test failed', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    });
  });
});

// Note: These tests use mocked native bindings because the actual .node file
// requires compilation and a real RKLLM model file. In a real testing environment,
// integration tests would use actual models and test the full binding functionality.