/**
 * Deno FFI Adapter
 * Implements the universal FFI interface using Deno's native FFI capabilities
 */

import type { RuntimeFFI, LibraryHandle, MemoryBuffer, FFISymbol, Pointer } from '../interfaces.js';
import type { TypeMappings } from '../../ffi/symbol-definitions.js';

// Deno global type declarations
declare global {
  interface Window {
    Deno?: any;
  }
}

const DenoGlobal = (globalThis as any).Deno;

/**
 * Deno FFI Adapter implementation
 */
export class DenoFFIAdapter implements RuntimeFFI {
  private lib: any = null;

  constructor() {
    // No initialization needed for Deno
  }

  isAvailable(): boolean {
    return this.isDenoEnvironment() && typeof DenoGlobal?.dlopen === 'function';
  }

  getRuntimeName(): 'deno' {
    return 'deno';
  }

  getLibraryExtension(): string {
    if (!this.isDenoEnvironment()) {
      throw new Error('Not running in Deno environment');
    }

    // Get platform-specific extension from Deno
    switch (DenoGlobal.build.os) {
      case 'windows':
        return 'dll';
      case 'darwin':
        return 'dylib';
      default:
        return 'so';
    }
  }

  loadLibrary(path: string, symbols: Record<string, FFISymbol>): LibraryHandle {
    if (!this.isDenoEnvironment()) {
      throw new Error('Deno FFI not available');
    }

    // Convert universal symbols to Deno FFI format
    const denoSymbols = this.convertSymbolsToDeno(symbols);
    
    try {
      this.lib = DenoGlobal.dlopen(path, denoSymbols);
      
      return {
        symbols: this.lib.symbols,
        close: () => this.lib.close()
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
    if (!this.isDenoEnvironment()) {
      throw new Error('Deno environment not available');
    }

    // Deno uses ArrayBuffer for memory management
    const buffer = new ArrayBuffer(size);
    const ptr = DenoGlobal.UnsafePointer.of(buffer);
    
    return {
      ptr,
      size,
      view: new DataView(buffer),
      free: () => {
        // Deno handles memory management automatically
        // Just clear the reference
      }
    };
  }

  freeMemory(buffer: MemoryBuffer): void {
    // Deno handles memory management automatically
    buffer.free();
  }

  createPointer(buffer: ArrayBuffer): Pointer {
    if (!this.isDenoEnvironment()) {
      throw new Error('Deno environment not available');
    }
    
    return DenoGlobal.UnsafePointer.of(buffer);
  }

  createCString(str: string): Pointer {
    if (!this.isDenoEnvironment()) {
      throw new Error('Deno environment not available');
    }
    
    // Create null-terminated string buffer
    const encoded = new TextEncoder().encode(str + '\0');
    const buffer = new ArrayBuffer(encoded.length);
    new Uint8Array(buffer).set(encoded);
    
    return DenoGlobal.UnsafePointer.of(buffer);
  }

  readCString(ptr: Pointer): string {
    if (!this.isDenoEnvironment()) {
      throw new Error('Deno environment not available');
    }
    
    // Read null-terminated string from pointer
    try {
      return DenoGlobal.UnsafePointerView.getCString(ptr);
    } catch (error) {
      throw new Error(`Failed to read C string: ${error}`);
    }
  }

  /**
   * Check if we're running in Deno environment
   */
  private isDenoEnvironment(): boolean {    return typeof DenoGlobal !== 'undefined' &&
           typeof DenoGlobal.version === 'object' &&
           typeof DenoGlobal.dlopen === 'function';
  }

  /**
   * Convert universal FFI symbols to Deno FFI format
   */
  private convertSymbolsToDeno(symbols: Record<string, FFISymbol>): Record<string, any> {
    const denoSymbols: Record<string, any> = {};
    const typeMapping = this.getDenoTypeMapping();

    for (const [name, symbol] of Object.entries(symbols)) {
      denoSymbols[name] = {
        parameters: symbol.args.map(arg => typeMapping[arg as keyof TypeMappings]),
        result: typeMapping[symbol.returns as keyof TypeMappings]
      };
    }

    return denoSymbols;
  }

  /**
   * Get Deno-specific type mappings
   */
  private getDenoTypeMapping(): TypeMappings {
    return {
      pointer: 'pointer',
      i32: 'i32',
      i8: 'i8',
      u32: 'u32',
      u8: 'u8',
      f32: 'f32',
      f64: 'f64',
      cstring: 'pointer', // Deno uses pointer for strings
      buffer: 'pointer',
    };
  }
}