/**
 * Universal RKLLM Implementation Tests
 * Tests for the universal RKLLM class across different runtimes
 */

import { describe, it, expect } from 'bun:test';
import { RKLLM } from '../../../src/rkllm.js';
import { RKLLMInputType } from '../../../src/types.js';
import { detectRuntime } from '../../../src/runtime/detector.js';
import { 
  TEST_MODEL_PATHS, 
  CONTEXT_LENGTHS, 
  DEFAULT_TEST_CONFIG,
  EXPECTED_ERRORS
} from '../../test-constants.js';

describe('Universal RKLLM Implementation', () => {
  it('should create RKLLM instance', () => {
    const llm = new RKLLM();
    expect(llm).toBeDefined();
    expect(llm.initialized).toBe(false);
    expect(llm.backendType).toBe(null);
  });

  it('should detect runtime correctly', () => {
    const runtime = detectRuntime();
    expect(runtime).toBeDefined();
    expect(['bun', 'node', 'deno', 'unknown']).toContain(runtime.name);
  });

  it('should handle initialization with invalid model path', async () => {
    const llm = new RKLLM();
    
    try {
      await llm.init({
        modelPath: TEST_MODEL_PATHS.NONEXISTENT_ALT,
        maxContextLen: CONTEXT_LENGTHS.SMALL,
      });
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Should throw an error for non-existent model
      expect(error).toBeDefined();
      expect(error instanceof Error).toBe(true);
      expect(error.message).toContain(EXPECTED_ERRORS.INVALID_MODEL);
    }
  });

  it('should provide consistent API interface', () => {
    const llm = new RKLLM();
    
    // Check that all expected methods exist
    expect(typeof llm.init).toBe('function');
    expect(typeof llm.run).toBe('function');
    expect(typeof llm.runStream).toBe('function');
    expect(typeof llm.destroy).toBe('function');
    expect(typeof llm.loadLoraAdapter).toBe('function');
    expect(typeof llm.unloadLoraAdapter).toBe('function');
    expect(typeof llm.getContextLength).toBe('function');
    expect(typeof llm.clearContext).toBe('function');
    expect(typeof llm.setChatTemplate).toBe('function');
    expect(typeof llm.loadPromptCache).toBe('function');
    expect(typeof llm.releasePromptCache).toBe('function');
    expect(typeof llm.abort).toBe('function');
    expect(typeof llm.isRunning).toBe('function');
    
    // Check properties
    expect(typeof llm.initialized).toBe('boolean');
    expect(typeof llm.runtimeName).toBe('string');
  });

  it('should report correct runtime name', () => {
    const llm = new RKLLM();
    const runtime = detectRuntime();
    
    // Before initialization, should return 'unknown'
    expect(llm.runtimeName).toBe('unknown');
    
    // Runtime name should match detected runtime after potential initialization
    if (runtime.name !== 'unknown') {
      expect(['bun', 'node', 'deno', 'unknown']).toContain(llm.runtimeName);
    }
  });

  it('should handle multiple initialization attempts', async () => {
    const llm = new RKLLM();
    
    try {
      // First initialization attempt (will fail due to invalid model)
      await llm.init({
        modelPath: TEST_MODEL_PATHS.NONEXISTENT,
        maxContextLen: CONTEXT_LENGTHS.SMALL,
      });
    } catch (error) {
      // Expected to fail
    }
    
    try {
      // Second initialization attempt should also fail with proper error
      await llm.init({
        modelPath: TEST_MODEL_PATHS.NONEXISTENT_ALT,
        maxContextLen: CONTEXT_LENGTHS.SMALL,
      });
      
      // Should not reach here if first init had any effect
      expect(true).toBe(false);
    } catch (error) {
      // Should get initialization error, not "already initialized" if first failed
      expect(error.message).not.toContain(EXPECTED_ERRORS.ALREADY_INITIALIZED);
    }
  });

  it('should prevent operations when not initialized', async () => {
    const llm = new RKLLM();
    
    const testInput = {
      inputType: RKLLMInputType.PROMPT,
      inputData: 'Hello, world!'
    };

    const testAdapter = {
      loraPath: './test-lora.bin',
      scale: 1.0
    };

    // All operations should throw when not initialized
    await expect(llm.run(testInput)).rejects.toThrow('not initialized');
    await expect(llm.runStream(testInput, { callback: () => {} })).rejects.toThrow('not initialized');
    await expect(llm.loadLoraAdapter(testAdapter)).rejects.toThrow('not initialized');
    await expect(llm.getContextLength()).rejects.toThrow('not initialized');
    await expect(llm.clearContext()).rejects.toThrow('not initialized');
    await expect(llm.setChatTemplate('sys', 'pre', 'post')).rejects.toThrow('not initialized');
    await expect(llm.loadPromptCache('./cache')).rejects.toThrow('not initialized');
    await expect(llm.releasePromptCache()).rejects.toThrow('not initialized');
    await expect(llm.abort()).rejects.toThrow('not initialized');
    await expect(llm.isRunning()).rejects.toThrow('not initialized');
  });

  it('should handle destroy when not initialized', async () => {
    const llm = new RKLLM();
    
    // Should not throw when destroying uninitialized instance
    await expect(llm.destroy()).resolves.not.toThrow();
  });

  it('should maintain backward compatibility with existing API', () => {
    const llm = new RKLLM();
    
    // Properties that should exist for backward compatibility
    expect(llm.hasOwnProperty('initialized')).toBe(true);
    expect(llm.hasOwnProperty('backendType')).toBe(true);
    
    // Backend type should be null when not initialized
    expect(llm.backendType).toBe(null);
  });

  it('should handle runtime selection correctly', async () => {
    const runtime = detectRuntime();
    
    if (runtime.name === 'bun' && runtime.ffiSupported) {
      // In Bun environment, should prefer Bun implementation
      const llm = new RKLLM();
      
      try {
        await llm.init({
          modelPath: './test-model.rkllm',
          maxContextLen: 1024,
        });
      } catch (error) {
        // Should fail due to missing model, but error should indicate runtime
        expect(error.message).toBeDefined();
      }
      
      // After attempted initialization, runtime name should be available
      if (llm.runtimeName !== 'unknown') {
        expect(['bun', 'node', 'deno']).toContain(llm.runtimeName);
      }
    }
  });
});