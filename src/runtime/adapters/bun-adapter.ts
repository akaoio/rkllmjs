/**
 * Bun FFI Adapter
 * Implements the universal FFI interface using Bun's native FFI capabilities
 */

import type { RuntimeFFI, LibraryHandle, MemoryBuffer, FFISymbol, Pointer } from '../interfaces.js';
import type { TypeMappings } from '../../ffi/symbol-definitions.js';

/**
 * Bun FFI Adapter implementation
 */
export class BunFFIAdapter implements RuntimeFFI {
  private bunFFI: any = null;

  constructor() {
    // Try to initialize synchronously
    this.initializeSync();
  }

  private initializeSync(): void {
    if (!this.isBunEnvironment()) {
      return;
    }

    try {
      // Use eval to dynamically import the bun:ffi module
      // This is a workaround for the synchronous interface requirement
      const importExpression = `import('bun:ffi')`;
      // For now, just check if we're in Bun environment
      // The actual FFI loading will be handled lazily
    } catch (error) {
      // FFI not available
    }
  }

  isAvailable(): boolean {
    if (!this.isBunEnvironment()) {
      return false;
    }
    
    // Try to ensure FFI is loaded (silently fails if not available)
    this.ensureFFILoaded();
    return this.bunFFI !== null;
  }

  getRuntimeName(): 'bun' {
    return 'bun';
  }

  getLibraryExtension(): string {
    // Return platform-specific extension
    if (typeof process !== 'undefined') {
      switch (process.platform) {
        case 'win32':
          return 'dll';
        case 'darwin':
          return 'dylib';
        default:
          return 'so';
      }
    }
    return 'so'; // Default for Linux/Unix
  }

  loadLibrary(path: string, symbols: Record<string, FFISymbol>): LibraryHandle {
    this.ensureFFILoaded();
    
    if (!this.bunFFI) {
      throw new Error('Bun FFI not available');
    }

    // Convert universal symbols to Bun FFI format
    const bunSymbols = this.convertSymbolsToBun(symbols);
    
    try {
      const lib = this.bunFFI.dlopen(path, bunSymbols);
      return {
        symbols: lib.symbols,
        close: lib.close?.bind(lib)
      };
    } catch (error) {
      throw new Error(`Failed to load library ${path}: ${error}`);
    }
  }

  private ensureFFILoaded(): void {
    // Skip FFI loading in test mode to prevent segfaults
    if (process.env.NODE_ENV === 'test' || process.env.RKLLMJS_TEST_MODE === 'true') {
      console.warn('Skipping FFI loading in test mode');
      return;
    }

    if (this.bunFFI === null && this.isBunEnvironment()) {
      try {
        // In Bun, try to access the FFI directly from the global Bun object
        const bunGlobal = globalThis.Bun as any;
        if (bunGlobal && bunGlobal.ffi) {
          this.bunFFI = {
            dlopen: bunGlobal.ffi.dlopen,
            ptr: bunGlobal.ffi.ptr,
            FFIType: bunGlobal.ffi.FFIType,
            suffix: bunGlobal.ffi.suffix || 'so'
          };
          return;
        }

        // Fallback: try dynamic import (this will work in newer Bun versions)
        try {
          const ffiModule = require('bun:ffi');
          this.bunFFI = {
            dlopen: ffiModule.dlopen,
            ptr: ffiModule.ptr,
            FFIType: ffiModule.FFIType,
            suffix: ffiModule.suffix || 'so'
          };
          return;
        } catch (requireError) {
          // If require fails, FFI is not available - this is not an error
          // in test environments or when FFI is disabled
          return;
        }
      } catch (error) {
        // FFI loading failed - mark as unavailable but don't throw
        return;
      }
    }
  }

  callFunction(handle: LibraryHandle, name: string, ...args: any[]): any {
    if (!(name in handle.symbols)) {
      throw new Error(`Function ${name} not found in library`);
    }
    
    try {
      return handle.symbols[name](...args);
    } catch (error) {
      throw new Error(`Failed to call function ${name}: ${error}`);
    }
  }

  allocateMemory(size: number): MemoryBuffer {
    this.ensureFFILoaded();
    
    if (!this.bunFFI) {
      throw new Error('Bun FFI not available');
    }

    const buffer = new ArrayBuffer(size);
    const ptr = this.bunFFI.ptr(buffer);
    
    return {
      ptr,
      size,
      view: new DataView(buffer),
      free: () => {
        // Bun handles memory management automatically
        // Just clear the reference
      }
    };
  }

  freeMemory(buffer: MemoryBuffer): void {
    // Bun handles memory management automatically
    buffer.free();
  }

  createPointer(buffer: ArrayBuffer): Pointer {
    this.ensureFFILoaded();
    
    if (!this.bunFFI) {
      throw new Error('Bun FFI not available');
    }
    return this.bunFFI.ptr(buffer);
  }

  createCString(str: string): Pointer {
    this.ensureFFILoaded();
    
    if (!this.bunFFI) {
      throw new Error('Bun FFI not available');
    }
    
    // Create null-terminated string buffer
    const encoded = new TextEncoder().encode(str + '\0');
    const buffer = new ArrayBuffer(encoded.length);
    new Uint8Array(buffer).set(encoded);
    
    return this.bunFFI.ptr(buffer);
  }

  readCString(ptr: Pointer): string {
    this.ensureFFILoaded();
    
    if (!this.bunFFI) {
      throw new Error('Bun FFI not available');
    }
    
    // Read null-terminated string from pointer
    // Note: This is a simplified implementation
    // Real implementation would need to handle memory access correctly
    throw new Error('readCString not yet implemented for Bun adapter');
  }

  /**
   * Check if we're running in Bun environment
   */
  private isBunEnvironment(): boolean {
    if (typeof globalThis.Bun === 'undefined' || typeof globalThis.Bun.version !== 'string') {
      return false;
    }
    
    // Check if FFI is available via bun:ffi import
    try {
      // For synchronous check, just verify Bun exists
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert universal FFI symbols to Bun FFI format
   */
  private convertSymbolsToBun(symbols: Record<string, FFISymbol>): Record<string, any> {
    this.ensureFFILoaded();
    
    if (!this.bunFFI) {
      throw new Error('Bun FFI not available');
    }

    const bunSymbols: Record<string, any> = {};
    const typeMapping = this.getBunTypeMapping();

    for (const [name, symbol] of Object.entries(symbols)) {
      bunSymbols[name] = {
        returns: typeMapping[symbol.returns as keyof TypeMappings],
        args: symbol.args.map(arg => typeMapping[arg as keyof TypeMappings])
      };
    }

    return bunSymbols;
  }

  /**
   * Get Bun-specific type mappings
   */
  private getBunTypeMapping(): TypeMappings {
    this.ensureFFILoaded();
    
    if (!this.bunFFI) {
      throw new Error('Bun FFI not available');
    }

    const FFIType = this.bunFFI.FFIType;
    
    return {
      pointer: FFIType.ptr,
      i32: FFIType.i32,
      i8: FFIType.i8,
      u32: FFIType.u32,
      u8: FFIType.u8,
      f32: FFIType.f32,
      f64: FFIType.f64,
      cstring: FFIType.cstring,
      buffer: FFIType.ptr, // Use pointer for buffers
    };
  }
}