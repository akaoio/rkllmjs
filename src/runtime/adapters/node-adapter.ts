/**
 * Node.js FFI Adapter
 * Implements the universal FFI interface using Node.js FFI libraries (koffi or node-ffi-napi)
 */

import type { RuntimeFFI, LibraryHandle, MemoryBuffer, FFISymbol, Pointer } from '../interfaces.js';
import type { TypeMappings } from '../../ffi/symbol-definitions.js';

/**
 * Node.js FFI Adapter implementation
 * Supports both koffi (preferred) and node-ffi-napi
 */
export class NodeFFIAdapter implements RuntimeFFI {
  private ffiLib: any = null;
  private ffiType: 'koffi' | 'ffi-napi' | null = null;

  constructor() {
    // Initialization will be done lazily
  }

  private initializeNodeFFI(): void {
    if (this.ffiLib) {
      return; // Already initialized
    }

    // Try koffi first (modern, faster)
    try {
      this.ffiLib = eval('require("koffi")');
      this.ffiType = 'koffi';
      return;
    } catch (error) {
      // koffi not available, try node-ffi-napi
    }

    // Try node-ffi-napi as fallback
    try {
      this.ffiLib = eval('require("ffi-napi")');
      this.ffiType = 'ffi-napi';
      return;
    } catch (error) {
      // No FFI library available
    }
  }

  isAvailable(): boolean {
    if (!this.isNodeEnvironment()) {
      return false;
    }
    this.initializeNodeFFI();
    return this.ffiLib !== null;
  }

  getRuntimeName(): 'node' {
    return 'node';
  }

  getLibraryExtension(): string {
    // Get platform-specific extension
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
    return 'so'; // Default to Linux
  }

  loadLibrary(path: string, symbols: Record<string, FFISymbol>): LibraryHandle {
    this.initializeNodeFFI();
    
    if (!this.ffiLib) {
      throw new Error('Node.js FFI library not available');
    }

    try {
      if (this.ffiType === 'koffi') {
        return this.loadWithKoffi(path, symbols);
      } else if (this.ffiType === 'ffi-napi') {
        return this.loadWithFFINapi(path, symbols);
      } else {
        throw new Error('No FFI implementation available');
      }
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
    this.initializeNodeFFI();
    
    if (!this.ffiLib) {
      throw new Error('Node.js FFI library not available');
    }

    let buffer: any;
    let ptr: any;

    if (this.ffiType === 'koffi') {
      // Koffi memory allocation
      buffer = Buffer.alloc(size);
      ptr = this.ffiLib.decode(buffer, 'void*');
    } else {
      // ffi-napi memory allocation
      const ref = eval('require("ref-napi")');
      buffer = Buffer.alloc(size);
      ptr = ref.address(buffer);
    }

    return {
      ptr,
      size,
      view: new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength),
      free: () => {
        // Node.js garbage collector will handle cleanup
      }
    };
  }

  freeMemory(buffer: MemoryBuffer): void {
    // Node.js garbage collector handles memory management
    buffer.free();
  }

  createPointer(arrayBuffer: ArrayBuffer): Pointer {
    this.initializeNodeFFI();
    
    if (!this.ffiLib) {
      throw new Error('Node.js FFI library not available');
    }

    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(arrayBuffer);

    if (this.ffiType === 'koffi') {
      return this.ffiLib.decode(buffer, 'void*');
    } else {
      const ref = eval('require("ref-napi")');
      return ref.address(buffer);
    }
  }

  createCString(str: string): Pointer {
    this.initializeNodeFFI();
    
    if (!this.ffiLib) {
      throw new Error('Node.js FFI library not available');
    }

    // Create null-terminated string buffer
    const buffer = Buffer.from(str + '\0', 'utf8');

    if (this.ffiType === 'koffi') {
      return this.ffiLib.decode(buffer, 'char*');
    } else {
      const ref = eval('require("ref-napi")');
      return ref.address(buffer);
    }
  }

  readCString(ptr: Pointer): string {
    this.initializeNodeFFI();
    
    if (!this.ffiLib) {
      throw new Error('Node.js FFI library not available');
    }

    if (this.ffiType === 'koffi') {
      return this.ffiLib.decode(ptr, 'char*');
    } else {
      const ref = eval('require("ref-napi")');
      return ref.readCString(ptr);
    }
  }

  /**
   * Load library using koffi
   */
  private loadWithKoffi(path: string, symbols: Record<string, FFISymbol>): LibraryHandle {
    const lib = this.ffiLib.load(path);
    const mappedSymbols: Record<string, any> = {};

    // Convert symbols to koffi format
    for (const [name, symbol] of Object.entries(symbols)) {
      const returnType = this.mapTypeForKoffi(symbol.returns);
      const argTypes = symbol.args.map(arg => this.mapTypeForKoffi(arg));
      
      mappedSymbols[name] = lib.func(name, returnType, argTypes);
    }

    return {
      symbols: mappedSymbols
    };
  }

  /**
   * Load library using node-ffi-napi
   */
  private loadWithFFINapi(path: string, symbols: Record<string, FFISymbol>): LibraryHandle {
    const mappedSymbols: Record<string, any> = {};

    // Convert symbols to ffi-napi format
    for (const [name, symbol] of Object.entries(symbols)) {
      const returnType = this.mapTypeForFFINapi(symbol.returns);
      const argTypes = symbol.args.map(arg => this.mapTypeForFFINapi(arg));
      
      mappedSymbols[name] = [returnType, argTypes];
    }

    const lib = this.ffiLib.Library(path, mappedSymbols);

    return {
      symbols: lib
    };
  }

  /**
   * Map universal types to koffi types
   */
  private mapTypeForKoffi(type: string): string {
    const mapping: Record<string, string> = {
      'pointer': 'void*',
      'i32': 'int32',
      'i8': 'int8',
      'u32': 'uint32',
      'u8': 'uint8',
      'f32': 'float',
      'f64': 'double',
      'cstring': 'char*',
      'buffer': 'void*'
    };

    return mapping[type] || 'void*';
  }

  /**
   * Map universal types to ffi-napi types
   */
  private mapTypeForFFINapi(type: string): string {
    const mapping: Record<string, string> = {
      'pointer': 'pointer',
      'i32': 'int32',
      'i8': 'int8',
      'u32': 'uint32',
      'u8': 'uint8',
      'f32': 'float',
      'f64': 'double',
      'cstring': 'string',
      'buffer': 'pointer'
    };

    return mapping[type] || 'pointer';
  }

  /**
   * Check if we're running in Node.js environment
   */
  private isNodeEnvironment(): boolean {
    return typeof process !== 'undefined' && 
           process.versions != null && 
           process.versions.node != null;
  }
}