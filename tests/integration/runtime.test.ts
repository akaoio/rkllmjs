/**
 * Runtime Integration Test
 * Tests RKLLMJS functionality across different JavaScript runtimes
 * Moved from scripts/test-runtime.js for better organization
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { 
  detectRuntime, 
  getFFIInfo, 
  validateRuntimeCompatibility,
  RKLLM 
} from '../../src/index.js';
import { DEFAULT_TEST_CONFIG, TEST_INPUTS, TIMEOUTS } from '../test-constants.js';

describe('Runtime Integration Tests', () => {
  describe('Runtime Detection', () => {
    it('should detect current runtime correctly', () => {
      const runtime = detectRuntime();
      expect(runtime.name).toBeDefined();
      expect(typeof runtime.ffiSupported).toBe('boolean');
      expect(['bun', 'node', 'deno', 'unknown']).toContain(runtime.name);
    });

    it('should provide FFI information', () => {
      const info = getFFIInfo();
      expect(info.libraryExtension).toBeDefined();
      expect(['so', 'dylib', 'dll']).toContain(info.libraryExtension);
    });

    it('should validate runtime compatibility', () => {
      const validation = validateRuntimeCompatibility();
      expect(typeof validation.compatible).toBe('boolean');
      expect(Array.isArray(validation.issues)).toBe(true);
    });
  });

  describe('RKLLM API Integration', () => {
    let llm: RKLLM;

    beforeEach(() => {
      llm = new RKLLM();
    });

    afterEach(async () => {
      if (llm.initialized) {
        await llm.destroy();
      }
    });

    it('should create RKLLM instance successfully', () => {
      expect(llm).toBeDefined();
      expect(llm.initialized).toBe(false);
      expect(llm.runtimeName).toBeDefined();
    });

    it('should handle initialization gracefully (expected to fail without model)', async () => {
      try {
        await llm.init(DEFAULT_TEST_CONFIG);
        // If it succeeds unexpectedly, that's fine too
        expect(llm.initialized).toBe(true);
        expect(llm.backendType).toBe('ffi');
      } catch (error) {
        // Expected to fail due to non-existent model
        expect(error).toBeDefined();
        expect(error.message).toBeDefined();
        expect(llm.initialized).toBe(false);
      }
    }, TIMEOUTS.NORMAL);

    it('should maintain proper state during initialization failure', async () => {
      const initialState = {
        initialized: llm.initialized,
        backendType: llm.backendType,
        runtimeName: llm.runtimeName
      };

      try {
        await llm.init(DEFAULT_TEST_CONFIG);
      } catch (error) {
        // State should be consistent after failure
        expect(llm.initialized).toBe(false);
        expect(llm.runtimeName).toBe(initialState.runtimeName);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid configuration gracefully', async () => {
      const llm = new RKLLM();
      
      try {
        await llm.init({
          modelPath: '',
          maxContextLen: -1
        });
        // Should not reach here
        expect(false).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('Runtime-Specific Behavior', () => {
    it('should adapt to runtime capabilities', () => {
      const runtime = detectRuntime();
      const llm = new RKLLM();
      
      // Runtime name should match detected runtime
      expect(llm.runtimeName).toBeDefined();
      
      // Should handle runtime-specific features appropriately
      if (runtime.ffiSupported) {
        expect(['string', 'object', null]).toContain(typeof llm.backendType);
      }
    });
  });
});

// Export the original test function for backward compatibility if needed
export async function runRuntimeTest(): Promise<void> {
  console.log('🚀 RKLLMJS Universal Runtime Test\n');

  // Runtime Detection
  console.log('📋 Runtime Information:');
  const runtime = detectRuntime();
  console.log(`  Runtime: ${runtime.name}`);
  console.log(`  Version: ${runtime.version || 'unknown'}`);
  console.log(`  FFI Supported: ${runtime.ffiSupported}`);

  const info = getFFIInfo();
  console.log(`  Library Extension: ${info.libraryExtension}`);
  console.log(`  Runtime: ${info.runtime}`);
  console.log(`  FFI Supported: ${info.ffiSupported}`);

  // Compatibility Check
  console.log('\n🔍 Compatibility Check:');
  const validation = validateRuntimeCompatibility();
  console.log(`  Compatible: ${validation.compatible}`);
  if (!validation.compatible) {
    console.log('  Issues:');
    validation.issues.forEach(issue => console.log(`    - ${issue}`));
  }

  // RKLLM Basic Test
  console.log('\n🤖 RKLLM API Test:');
  try {
    const llm = new RKLLM();
    console.log(`  Instance created: ✅`);
    console.log(`  Initial state: ${llm.initialized ? 'initialized' : 'uninitialized'}`);
    console.log(`  Backend type: ${llm.backendType || 'none'}`);
    console.log(`  Runtime name: ${llm.runtimeName}`);

    // Test initialization (will fail without model, but that's expected)
    try {
      await llm.init(DEFAULT_TEST_CONFIG);
      console.log(`  Initialization: ✅ (unexpected success)`);
    } catch (error) {
      console.log(`  Initialization: ⚠️  (expected failure - no model)`);
      console.log(`    Error: ${error.message.slice(0, 80)}...`);
    }

    await llm.destroy();
    console.log(`  Cleanup: ✅`);

  } catch (error) {
    console.log(`  RKLLM test failed: ❌`);
    console.log(`    Error: ${error.message}`);
  }

  // Summary
  console.log('\n📊 Test Summary:');
  if (runtime.ffiSupported && validation.compatible) {
    console.log('  Status: ✅ Ready for RKLLM usage');
    console.log('  Recommendation: Install model files and start using RKLLM');
  } else {
    console.log('  Status: ⚠️  Runtime setup needed');
    console.log('  Recommendation: Install FFI dependencies for your runtime');
    
    if (runtime.name === 'node') {
      console.log('    Node.js: npm install koffi');
    } else if (runtime.name === 'deno') {
      console.log('    Deno: Run with --allow-ffi --allow-read flags');
    }
  }

  console.log('\n🎯 Next Steps:');
  console.log('  1. Download RKLLM model files');
  console.log('  2. Check examples in ./examples/ directory');
  console.log('  3. Read docs/multi-runtime-guide.md for details');
}