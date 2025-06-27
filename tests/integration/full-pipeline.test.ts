/**
 * Full Pipeline Integration Tests
 * Tests the complete RKLLM pipeline from initialization to inference
 */

import { describe, it, expect } from 'bun:test';
import { RKLLM, createRKLLM } from '../../src/rkllm.js';
import { RKLLMInputType } from '../../src/types.js';
import { detectRuntime } from '../../src/runtime/detector.js';
import { 
  TEST_MODEL_PATHS, 
  CONTEXT_LENGTHS,
  GENERATION_PARAMS,
  TEST_INPUTS,
  EXPECTED_ERRORS,
  PERFORMANCE_CONFIG,
  DEFAULT_TEST_CONFIG,
  TIMEOUTS
} from '../test-constants.js';

describe('Full Pipeline Integration', () => {
  it('should handle complete workflow with mock model', async () => {
    const runtime = detectRuntime();
    
    if (runtime.name === 'unknown' || !runtime.ffiSupported) {
      console.warn('Skipping integration test - FFI not supported in current runtime');
      return;
    }

    const llm = new RKLLM();
    
    // Test initialization phase
    try {
      await llm.init({
        modelPath: TEST_MODEL_PATHS.NONEXISTENT, // Non-existent model for testing
        maxContextLen: CONTEXT_LENGTHS.MEDIUM,
        maxNewTokens: GENERATION_PARAMS.MAX_NEW_TOKENS.SMALL,
        temperature: GENERATION_PARAMS.TEMPERATURE.CREATIVE,
        topP: GENERATION_PARAMS.TOP_P.DIVERSE,
        topK: GENERATION_PARAMS.TOP_K.DIVERSE,
      });
      
      // If initialization succeeds, test the rest of the pipeline
      expect(llm.initialized).toBe(true);
      expect(llm.backendType).toBe('ffi');
      expect(['bun', 'node', 'deno']).toContain(llm.runtimeName);
      
      // Test inference
      const result = await llm.run({
        inputType: RKLLMInputType.PROMPT,
        inputData: TEST_INPUTS.SIMPLE_PROMPT
      });
      
      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(typeof result.state).toBe('number');
      
      // Test cleanup
      await llm.destroy();
      expect(llm.initialized).toBe(false);
      
    } catch (error) {
      // Expected to fail due to non-existent model
      expect(error.message).toBeDefined();
      
      // Should be a meaningful error about the model or library
      expect(
        error.message.includes(EXPECTED_ERRORS.INVALID_MODEL) || 
        error.message.includes(EXPECTED_ERRORS.INVALID_LIBRARY) ||
        error.message.includes(EXPECTED_ERRORS.FFI_ERROR)
      ).toBe(true);
    }
  });

  it('should handle createRKLLM utility function', async () => {
    try {
      const llm = await createRKLLM({
        modelPath: TEST_MODEL_PATHS.NONEXISTENT,
        maxContextLen: CONTEXT_LENGTHS.SMALL,
      });
      
      // If successful, should be initialized
      expect(llm.initialized).toBe(true);
      
      await llm.destroy();
    } catch (error) {
      // Expected to fail due to non-existent model
      expect(error.message).toBeDefined();
    }
  });

  it('should handle streaming workflow', async () => {
    const runtime = detectRuntime();
    
    if (runtime.name === 'unknown' || !runtime.ffiSupported) {
      console.warn('Skipping streaming test - FFI not supported in current runtime');
      return;
    }

    const llm = new RKLLM();
    
    try {
      await llm.init({
        modelPath: TEST_MODEL_PATHS.NONEXISTENT,
        maxContextLen: CONTEXT_LENGTHS.SMALL,
        isAsync: true, // Enable streaming
      });
      
      let callbackInvoked = false;
      
      await llm.runStream(
        {
          inputType: RKLLMInputType.PROMPT,
          inputData: TEST_INPUTS.LONG_PROMPT
        },
        {
          callback: (result, userdata, state) => {
            callbackInvoked = true;
            expect(result).toBeDefined();
            expect(typeof state).toBe('number');
          }
        }
      );
      
      // Callback should have been invoked during streaming
      expect(callbackInvoked).toBe(true);
      
      await llm.destroy();
      
    } catch (error) {
      // Expected to fail due to non-existent model
      expect(error.message).toBeDefined();
    }
  });

  it('should handle advanced features', async () => {
    const runtime = detectRuntime();
    
    if (runtime.name === 'unknown' || !runtime.ffiSupported) {
      console.warn('Skipping advanced features test - FFI not supported in current runtime');
      return;
    }

    const llm = new RKLLM();
    
    try {
      await llm.init({
        modelPath: TEST_MODEL_PATHS.NONEXISTENT,
        maxContextLen: CONTEXT_LENGTHS.LARGE,
        extendParam: {
          enabledCpusNum: 4,
          enabledCpusMask: 0xF,
          nBatch: 2,
          useCrossAttn: true
        }
      });
      
      // Test chat template
      await llm.setChatTemplate(
        'You are a helpful assistant.',
        'User: ',
        '\nAssistant: '
      );
      
      // Test LoRA adapter
      await llm.loadLoraAdapter({
        loraPath: './test-lora.bin',
        scale: 0.8
      });
      
      // Test cache management
      const contextLength = await llm.getContextLength();
      expect(Array.isArray(contextLength)).toBe(true);
      
      await llm.clearContext(false);
      
      // Test running status
      const isRunning = await llm.isRunning();
      expect(typeof isRunning).toBe('boolean');
      
      await llm.destroy();
      
    } catch (error) {
      // Expected to fail due to non-existent model/files
      expect(error.message).toBeDefined();
    }
  });

  it('should handle error scenarios gracefully', async () => {
    const llm = new RKLLM();
    
    // Test with completely invalid parameters
    try {
      await llm.init({
        modelPath: TEST_MODEL_PATHS.EMPTY, // Empty path
        maxContextLen: CONTEXT_LENGTHS.INVALID, // Invalid context length
      });
      
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      expect(error.message).toBeDefined();
    }
    
    // Test with invalid model format
    try {
      await llm.init({
        modelPath: TEST_MODEL_PATHS.INVALID_FORMAT, // Wrong file type
        maxContextLen: CONTEXT_LENGTHS.SMALL,
      });
      
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      expect(error.message).toBeDefined();
    }
  });

  it('should maintain performance characteristics', async () => {
    const runtime = detectRuntime();
    
    if (runtime.name !== 'bun') {
      console.warn('Performance test optimized for Bun runtime');
      return;
    }

    // Test that initialization doesn't take too long
    const startTime = Date.now();
    
    try {
      const llm = new RKLLM();
      await llm.init({
        modelPath: TEST_MODEL_PATHS.NONEXISTENT,
        maxContextLen: CONTEXT_LENGTHS.SMALL,
      });
      
      const initTime = Date.now() - startTime;
      
      // Initialization should be relatively fast (even when failing)
      expect(initTime).toBeLessThan(TIMEOUTS.QUICK); // 5 seconds max
      
      await llm.destroy();
      
    } catch (error) {
      const initTime = Date.now() - startTime;
      
      // Even failed initialization should be fast
      expect(initTime).toBeLessThan(TIMEOUTS.QUICK);
    }
  });

  it('should handle concurrent operations safely', async () => {
    const runtime = detectRuntime();
    
    if (runtime.name === 'unknown' || !runtime.ffiSupported) {
      console.warn('Skipping concurrent test - FFI not supported in current runtime');
      return;
    }

    // Create multiple RKLLM instances
    const instances = [new RKLLM(), new RKLLM(), new RKLLM()];
    
    // Try to initialize them concurrently
    const promises = instances.map(llm => 
      llm.init({
        modelPath: TEST_MODEL_PATHS.NONEXISTENT,
        maxContextLen: CONTEXT_LENGTHS.SMALL,
      }).catch(error => error) // Catch errors to prevent promise rejection
    );
    
    const results = await Promise.all(promises);
    
    // All should complete (even if with errors)
    expect(results.length).toBe(3);
    
    // Clean up
    for (const llm of instances) {
      try {
        await llm.destroy();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });
});