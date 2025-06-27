/**
 * Full Pipeline Integration Tests
 * Tests the complete RKLLM pipeline from initialization to inference - with safe mocking
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

    // Use mock mode to prevent segfaults
    const llm = new RKLLM();
    
    // Test initialization phase with mock mode
    await llm.init({
      modelPath: TEST_MODEL_PATHS.NONEXISTENT,
      maxContextLen: CONTEXT_LENGTHS.MEDIUM,
      maxNewTokens: GENERATION_PARAMS.MAX_NEW_TOKENS.SMALL,
      temperature: GENERATION_PARAMS.TEMPERATURE.CREATIVE,
      topP: GENERATION_PARAMS.TOP_P.DIVERSE,
      topK: GENERATION_PARAMS.TOP_K.DIVERSE,
    }, { mockMode: true });
    
    // Should succeed with mock
    expect(llm.initialized).toBe(true);
    expect(llm.backendType).toBe('mock');
    expect(llm.runtimeName).toBe('mock');
    
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
  });

  it('should handle createRKLLM utility function', async () => {
    const llm = await createRKLLM({
      modelPath: TEST_MODEL_PATHS.NONEXISTENT,
      maxContextLen: CONTEXT_LENGTHS.SMALL,
    }, { mockMode: true });
    
    // Should be initialized with mock
    expect(llm.initialized).toBe(true);
    expect(llm.backendType).toBe('mock');
    
    await llm.destroy();
  });

  it('should handle streaming workflow', async () => {
    const runtime = detectRuntime();
    
    if (runtime.name === 'unknown' || !runtime.ffiSupported) {
      console.warn('Skipping streaming test - FFI not supported in current runtime');
      return;
    }

    const llm = new RKLLM();
    
    await llm.init({
      modelPath: TEST_MODEL_PATHS.NONEXISTENT,
      maxContextLen: CONTEXT_LENGTHS.SMALL,
      isAsync: true,
    }, { mockMode: true });

    expect(llm.initialized).toBe(true);
    expect(llm.backendType).toBe('mock');

    // Test streaming with callback
    const results: any[] = [];
    await llm.runStream({
      inputType: RKLLMInputType.PROMPT,
      inputData: TEST_INPUTS.SIMPLE_PROMPT
    }, {
      callback: (result, userdata) => {
        results.push(result);
        expect(result).toBeDefined();
        expect(result.text).toBeDefined();
        expect(typeof result.state).toBe('number');
      }
    });

    expect(results.length).toBeGreaterThan(0);
    
    await llm.destroy();
  });

  it('should handle advanced features', async () => {
    const llm = new RKLLM();
    
    await llm.init({
      modelPath: TEST_MODEL_PATHS.NONEXISTENT,
      maxContextLen: CONTEXT_LENGTHS.LARGE,
      temperature: GENERATION_PARAMS.TEMPERATURE.BALANCED,
      topP: GENERATION_PARAMS.TOP_P.BALANCED,
      topK: GENERATION_PARAMS.TOP_K.BALANCED,
    }, { mockMode: true });

    expect(llm.initialized).toBe(true);
    expect(llm.backendType).toBe('mock');

    // Test various advanced features
    await llm.setChatTemplate("System", "User: ", " Assistant:");
    await llm.clearContext(false);
    
    // Test multiple inferences
    const result1 = await llm.run({
      inputType: RKLLMInputType.PROMPT,
      inputData: TEST_INPUTS.SIMPLE_PROMPT
    });
    
    const result2 = await llm.run({
      inputType: RKLLMInputType.PROMPT,
      inputData: TEST_INPUTS.LONG_PROMPT
    });

    expect(result1.text).toBeDefined();
    expect(result2.text).toBeDefined();
    
    await llm.destroy();
  });
});
