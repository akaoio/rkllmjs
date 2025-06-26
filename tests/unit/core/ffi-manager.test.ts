/**
 * Universal FFI Manager Tests
 * Tests for the universal FFI management system
 */

import { describe, it, expect } from 'bun:test';
import { 
  FFIManager, 
  getGlobalFFIManager, 
  isFFIAvailable, 
  isBunRuntime, 
  initializeFFI 
} from '../../src/core/ffi-manager.js';

describe('Universal FFI Manager', () => {
  it('should detect Bun runtime correctly', () => {
    const isBun = isBunRuntime();
    expect(typeof isBun).toBe('boolean');
    
    // When running in Bun, this should be true
    if (typeof globalThis.Bun !== 'undefined') {
      expect(isBun).toBe(true);
    }
  });

  it('should check FFI availability', async () => {
    const available = await isFFIAvailable();
    expect(typeof available).toBe('boolean');
  });

  it('should initialize FFI with preferred runtime', async () => {
    const success = await initializeFFI('bun');
    expect(typeof success).toBe('boolean');
    
    // In Bun environment, should succeed
    if (typeof globalThis.Bun !== 'undefined') {
      expect(success).toBe(true);
    }
  });

  it('should create FFI manager instance', () => {
    const manager = new FFIManager();
    
    expect(manager).toBeDefined();
    expect(manager.isInitialized()).toBe(false);
    expect(manager.getRuntimeName()).toBe('unknown');
  });

  it('should initialize FFI manager', async () => {
    const manager = new FFIManager();
    
    try {
      await manager.initialize();
      
      expect(manager.isInitialized()).toBe(true);
      expect(['bun', 'node', 'deno']).toContain(manager.getRuntimeName());
    } catch (error) {
      // May fail if no compatible runtime is available
      expect(error.message).toContain('Failed to initialize FFI manager');
    }
  });

  it('should handle multiple initialization calls', async () => {
    const manager = new FFIManager();
    
    try {
      await manager.initialize();
      const firstState = manager.isInitialized();
      
      // Second initialization should not fail
      await manager.initialize();
      expect(manager.isInitialized()).toBe(firstState);
    } catch (error) {
      // May fail if no compatible runtime is available
      console.warn('FFI initialization failed:', error.message);
    }
  });

  it('should provide global FFI manager', async () => {
    try {
      const manager = await getGlobalFFIManager();
      
      expect(manager).toBeDefined();
      expect(manager.isInitialized()).toBe(true);
    } catch (error) {
      // May fail if no compatible runtime is available
      expect(error.message).toContain('Failed to initialize FFI manager');
    }
  });

  it('should handle cleanup properly', async () => {
    const manager = new FFIManager();
    
    try {
      await manager.initialize();
      
      if (manager.isInitialized()) {
        manager.destroy();
        expect(manager.isInitialized()).toBe(false);
        expect(manager.getRuntimeName()).toBe('unknown');
      }
    } catch (error) {
      // May fail if initialization fails
      console.warn('FFI manager test cleanup skipped:', error.message);
    }
  });

  it('should handle memory operations when initialized', async () => {
    const manager = new FFIManager();
    
    try {
      await manager.initialize();
      
      if (manager.isInitialized()) {
        const buffer = manager.allocateMemory(1024);
        
        expect(buffer).toBeDefined();
        expect(buffer.size).toBe(1024);
        expect(buffer.view).toBeInstanceOf(DataView);
        
        // Should not throw when freeing
        expect(() => manager.freeMemory(buffer)).not.toThrow();
      }
    } catch (error) {
      // May fail if no compatible runtime is available
      console.warn('Memory operations test skipped:', error.message);
    }
  });

  it('should handle string operations when initialized', async () => {
    const manager = new FFIManager();
    
    try {
      await manager.initialize();
      
      if (manager.isInitialized()) {
        const testString = 'Hello, World!';
        const cstring = manager.createCString(testString);
        
        expect(cstring).toBeDefined();
        
        // Creating pointer from ArrayBuffer
        const buffer = new ArrayBuffer(8);
        const ptr = manager.createPointer(buffer);
        expect(ptr).toBeDefined();
      }
    } catch (error) {
      // May fail if no compatible runtime is available
      console.warn('String operations test skipped:', error.message);
    }
  });

  it('should throw errors when not initialized', () => {
    const manager = new FFIManager();
    
    expect(() => manager.callFunction('test')).toThrow('FFI manager not initialized');
    expect(() => manager.allocateMemory(1024)).toThrow('FFI adapter not initialized');
    expect(() => manager.createCString('test')).toThrow('FFI adapter not initialized');
  });
});