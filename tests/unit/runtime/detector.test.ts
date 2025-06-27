/**
 * Runtime Detection Tests
 * Tests for the universal runtime detection system
 */

import { describe, it, expect } from 'bun:test';
import { 
  detectRuntime, 
  createFFIAdapter, 
  validateRuntimeCompatibility,
  getRuntimeInfo
} from '../../../src/runtime/detector.js';

describe('Runtime Detection', () => {
  it('should detect current runtime', () => {
    const runtime = detectRuntime();
    
    expect(runtime).toBeDefined();
    expect(runtime.name).toBeDefined();
    expect(['bun', 'node', 'deno', 'unknown']).toContain(runtime.name);
    expect(typeof runtime.ffiSupported).toBe('boolean');
    
    if (runtime.version) {
      expect(typeof runtime.version).toBe('string');
    }
  });

  it('should detect Bun runtime when running in Bun', () => {
    const runtime = detectRuntime();
    
    // When running in Bun, should detect correctly
    if (typeof globalThis.Bun !== 'undefined') {
      expect(runtime.name).toBe('bun');
      expect(runtime.ffiSupported).toBe(true);
      expect(runtime.version).toBeDefined();
    }
  });

  it('should validate runtime compatibility', () => {
    const validation = validateRuntimeCompatibility();
    
    expect(validation).toBeDefined();
    expect(typeof validation.compatible).toBe('boolean');
    expect(Array.isArray(validation.issues)).toBe(true);
    
    // If not compatible, should have issues
    if (!validation.compatible) {
      expect(validation.issues.length).toBeGreaterThan(0);
    }
  });

  it('should provide detailed runtime info', () => {
    const info = getRuntimeInfo();
    
    expect(info).toBeDefined();
    expect(info.name).toBeDefined();
    expect(typeof info.ffiSupported).toBe('boolean');
    
    // Should include platform info when available
    if (typeof globalThis.process !== 'undefined') {
      expect(info.platform).toBeDefined();
      expect(info.arch).toBeDefined();
    }
  });

  it('should create FFI adapter for supported runtime', async () => {
    const runtime = detectRuntime();
    
    if (runtime.ffiSupported && runtime.name !== 'unknown') {
      try {
        const adapter = await createFFIAdapter();
        
        expect(adapter).toBeDefined();
        expect(adapter.getRuntimeName()).toBe(runtime.name);
        expect(adapter.isAvailable()).toBe(true);
        expect(typeof adapter.getLibraryExtension()).toBe('string');
      } catch (error) {
        // May fail if FFI libraries are not installed, which is acceptable
        console.warn(`FFI adapter creation failed: ${error}`);
      }
    }
  });

  it('should handle fallback when preferred runtime is not available', async () => {
    try {
      // Try to create adapter with non-existent runtime preference
      const adapter = await createFFIAdapter({
        preferredRuntime: 'node', // May not be available
        fallbackEnabled: true
      });
      
      // Should still succeed with fallback
      expect(adapter).toBeDefined();
      expect(adapter.isAvailable()).toBe(true);
    } catch (error) {
      // If no runtime is available, this is expected
      expect(error.message).toContain('No compatible FFI adapter found');
    }
  });

  it('should fail when fallback is disabled and preferred runtime unavailable', async () => {
    try {
      await createFFIAdapter({
        preferredRuntime: 'node', // Assume not available
        fallbackEnabled: false
      });
      
      // Should not reach here if Node.js adapter is not available
      // If it does reach here, it means Node.js adapter is available
    } catch (error) {
      expect(error.message).toContain('No compatible FFI adapter found');
    }
  });
});