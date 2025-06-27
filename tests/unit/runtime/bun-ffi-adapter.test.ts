/**
 * Bun FFI Adapter Tests
 * Tests for the Bun FFI adapter implementation
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { BunFFIAdapter } from '../../../src/runtime/adapters/bun-adapter.js';
import { RKLLM_SYMBOLS } from '../../../src/ffi/symbol-definitions.js';

describe('Bun FFI Adapter', () => {
  let adapter: BunFFIAdapter;

  beforeEach(() => {
    adapter = new BunFFIAdapter();
  });

  it('should identify as Bun runtime', () => {
    expect(adapter.getRuntimeName()).toBe('bun');
  });

  it('should check availability correctly', () => {
    const available = adapter.isAvailable();
    expect(typeof available).toBe('boolean');
    
    // In Bun environment, may or may not be available depending on test setup
    if (typeof globalThis.Bun !== 'undefined') {
      // Should not throw when checking availability
      expect(() => adapter.isAvailable()).not.toThrow();
    }
  });

  it('should provide correct library extension', () => {
    const extension = adapter.getLibraryExtension();
    expect(typeof extension).toBe('string');
    expect(['so', 'dylib', 'dll']).toContain(extension);
  });

  it('should handle memory allocation', () => {
    if (!adapter.isAvailable()) {
      expect(() => adapter.allocateMemory(1024)).toThrow('Bun FFI not available');
      return;
    }

    const buffer = adapter.allocateMemory(1024);
    
    expect(buffer).toBeDefined();
    expect(buffer.size).toBe(1024);
    expect(buffer.view).toBeInstanceOf(DataView);
    expect(buffer.ptr).toBeDefined();
    expect(typeof buffer.free).toBe('function');
    
    // Should not throw when freeing
    expect(() => buffer.free()).not.toThrow();
  });

  it('should create pointers from ArrayBuffers', () => {
    if (!adapter.isAvailable()) {
      expect(() => adapter.createPointer(new ArrayBuffer(8))).toThrow('Bun FFI not available');
      return;
    }

    const buffer = new ArrayBuffer(8);
    const ptr = adapter.createPointer(buffer);
    
    expect(ptr).toBeDefined();
  });

  it('should create C strings', () => {
    if (!adapter.isAvailable()) {
      expect(() => adapter.createCString('test')).toThrow('Bun FFI not available');
      return;
    }

    const testString = 'Hello, World!';
    const ptr = adapter.createCString(testString);
    
    expect(ptr).toBeDefined();
  });

  it('should attempt to load library with correct symbols', () => {
    if (!adapter.isAvailable()) {
      expect(() => adapter.loadLibrary('test.so', RKLLM_SYMBOLS)).toThrow();
      return;
    }

    // This will likely fail since we don't have the actual library
    // But it should handle the error gracefully
    try {
      const lib = adapter.loadLibrary('nonexistent.so', RKLLM_SYMBOLS);
      
      // If it succeeds (unlikely), verify the structure
      expect(lib).toBeDefined();
      expect(lib.symbols).toBeDefined();
    } catch (error) {
      // Expected to fail - should contain meaningful error message
      expect(error.message).toContain('Failed to load library');
    }
  });

  it('should handle function calls on loaded library', () => {
    if (!adapter.isAvailable()) {
      return;
    }

    // Create a mock library handle
    const mockLib = {
      symbols: {
        test_function: () => 42
      }
    };

    const result = adapter.callFunction(mockLib, 'test_function');
    expect(result).toBe(42);
    
    // Should throw for non-existent function
    expect(() => adapter.callFunction(mockLib, 'nonexistent')).toThrow('Function nonexistent not found');
  });

  it('should handle errors gracefully when FFI is not available', () => {
    const mockAdapter = new BunFFIAdapter();
    // Force FFI to be unavailable
    (mockAdapter as any).bunFFI = null;
    (mockAdapter as any).isBunEnvironment = () => false;

    expect(() => mockAdapter.loadLibrary('test.so', {})).toThrow();
    expect(() => mockAdapter.allocateMemory(1024)).toThrow();
    expect(() => mockAdapter.createPointer(new ArrayBuffer(8))).toThrow();
    expect(() => mockAdapter.createCString('test')).toThrow();
  });
});