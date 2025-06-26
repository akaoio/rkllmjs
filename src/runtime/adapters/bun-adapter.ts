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
  private bunFFI: typeof import('bun:ffi') | null = null;

  constructor() {
    // Dynamically import Bun FFI to avoid errors in other runtimes
    this.initializeBunFFI();
  }

  private async initializeBunFFI() {
    try {
      // Only import if we're in Bun runtime
      if (this.isBunEnvironment()) {
        this.bunFFI = await import('bun:ffi');
      }
    } catch (error) {
      // FFI not available
    }
  }

  isAvailable(): boolean {
    return this.isBunEnvironment() && this.bunFFI !== null;
  }

  getRuntimeName(): 'bun' {
    return 'bun';
  }

  getLibraryExtension(): string {
    if (!this.bunFFI) {
      throw new Error('Bun FFI not available');
    }
    return this.bunFFI.suffix;
  }

  loadLibrary(path: string, symbols: Record<string, FFISymbol>): LibraryHandle {
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
    if (!this.bunFFI) {
      throw new Error('Bun FFI not available');
    }
    return this.bunFFI.ptr(buffer);
  }

  createCString(str: string): Pointer {
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
    return typeof globalThis.Bun !== 'undefined' && 
           typeof globalThis.Bun.version === 'string' &&
           typeof globalThis.Bun.dlopen === 'function';
  }

  /**
   * Convert universal FFI symbols to Bun FFI format
   */
  private convertSymbolsToBun(symbols: Record<string, FFISymbol>): Record<string, any> {
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
    if (!this.bunFFI) {
      throw new Error('Bun FFI not available');
    }

    const { FFIType } = this.bunFFI;
    
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