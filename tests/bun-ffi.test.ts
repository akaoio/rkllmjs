/**
 * Universal Multi-Runtime FFI Tests
 * Tests for the universal RKLLM implementation across all supported runtimes
 */

import { describe, it, expect } from 'bun:test';
import { 
  RKLLM, 
  isBunRuntime, 
  initializeFFI, 
  isFFIAvailable,
  detectRuntime,
  getFFIInfo
} from '../src/index.js';
import { RKLLMInputType } from '../src/types.js';

describe('Universal Multi-Runtime FFI', () => {
  it('should detect current runtime correctly', () => {
    const runtime = detectRuntime();
    expect(runtime).toBeDefined();
    expect(['bun', 'node', 'deno', 'unknown']).toContain(runtime.name);
    expect(typeof runtime.ffiSupported).toBe('boolean');
  });

  it('should provide FFI information', () => {
    const info = getFFIInfo();
    expect(info).toBeDefined();
    expect(info.runtime).toBeDefined();
    expect(['bun', 'node', 'deno', 'unknown']).toContain(info.runtime);
    expect(typeof info.ffiSupported).toBe('boolean');
    expect(typeof info.libraryExtension).toBe('string');
  });
  it('should detect Bun runtime correctly', () => {
    const isBun = isBunRuntime();
    expect(typeof isBun).toBe('boolean');
    
    // When running in Bun, this should be true
    if (typeof Bun !== 'undefined') {
      expect(isBun).toBe(true);
    }
  });

  it('should handle FFI initialization gracefully', () => {
    // This may fail if library is not available, but should not throw
    const success = initializeFFI();
    expect(typeof success).toBe('boolean');
  });

  it('should detect FFI availability', () => {
    const available = isFFIAvailable();
    expect(typeof available).toBe('boolean');
  });

  it('should create RKLLM instance', () => {
    const llm = new RKLLM();
    expect(llm).toBeDefined();
    expect(llm.initialized).toBe(false);
  });

  it('should handle initialization without model gracefully', async () => {
    const llm = new RKLLM();
    
    try {
      await llm.init({
        modelPath: './non-existent-model.rkllm',
        maxContextLen: 1024,
      });
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Should throw an error for non-existent model
      expect(error).toBeDefined();
      expect(error instanceof Error).toBe(true);
    }
  });

  it('should use FFI backend exclusively', async () => {
    const llm = new RKLLM();
    
    try {
      // Try to initialize - should always use FFI backend
      await llm.init({
        modelPath: './non-existent-model.rkllm',
        maxContextLen: 1024,
      });
    } catch (error) {
      // Should fail but not crash
      expect(error).toBeDefined();
    }
    
    // Should only be null (not initialized) or 'ffi'
    expect(llm.backendType === null || llm.backendType === 'ffi').toBe(true);
  });

  it('should provide consistent API', () => {
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
    
    // FFI-specific methods
    expect(typeof llm.setChatTemplate).toBe('function');
    expect(typeof llm.loadPromptCache).toBe('function');
    expect(typeof llm.releasePromptCache).toBe('function');
    expect(typeof llm.abort).toBe('function');
    expect(typeof llm.isRunning).toBe('function');
    
    // Check properties
    expect(typeof llm.initialized).toBe('boolean');
    expect(llm.backendType === null || llm.backendType === 'ffi').toBe(true);
  });
});

describe('Type Definitions', () => {
  it('should have correct enum values', () => {
    expect(RKLLMInputType.PROMPT).toBe(0);
    expect(RKLLMInputType.TOKEN).toBe(1);
    expect(RKLLMInputType.EMBED).toBe(2);
    expect(RKLLMInputType.MULTIMODAL).toBe(3);
  });
});

describe('Error Handling', () => {
  it('should throw when using uninitialized instance', async () => {
    const llm = new RKLLM();
    
    await expect(llm.run({
      inputType: RKLLMInputType.PROMPT,
      inputData: "test"
    })).rejects.toThrow('not initialized');
    
    await expect(llm.runStream({
      inputType: RKLLMInputType.PROMPT,
      inputData: "test"
    }, {
      callback: () => {}
    })).rejects.toThrow('not initialized');
    
    expect(() => llm.getContextLength()).toThrow('not initialized');
    
    await expect(llm.clearContext()).rejects.toThrow('not initialized');
  });

  it('should handle double initialization', async () => {
    const llm = new RKLLM();
    
    // Mock successful initialization
    const mockBackend = {
      init: async () => {},
      run: async () => ({ text: 'test', state: 2 }),
      runStream: async () => {},
      destroy: async () => {},
      initialized: true
    };
    
    // Override the backend for testing
    (llm as any).backend = mockBackend;
    
    await expect(llm.init({
      modelPath: './test.rkllm',
      maxContextLen: 1024,
    })).rejects.toThrow('already initialized');
  });
});