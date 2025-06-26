/**
 * Universal interfaces for multi-runtime FFI support
 * Provides abstractions for different JavaScript runtime FFI implementations
 */

/**
 * Universal FFI symbol definition
 */
export interface FFISymbol {
  returns: string;  // Return type as string (mapped to runtime-specific types)
  args: string[];   // Argument types as strings
}

/**
 * Universal FFI library handle
 */
export interface LibraryHandle {
  symbols: Record<string, any>;
  close?(): void;
}

/**
 * Universal pointer representation
 */
export type Pointer = number | bigint | any;

/**
 * Memory buffer representation
 */
export interface MemoryBuffer {
  ptr: Pointer;
  size: number;
  view: DataView;
  free(): void;
}

/**
 * Universal Runtime FFI Interface
 * Each runtime adapter must implement this interface
 */
export interface RuntimeFFI {
  /**
   * Check if this runtime adapter is available
   */
  isAvailable(): boolean;

  /**
   * Load a dynamic library with symbol definitions
   * @param path Path to the library file
   * @param symbols Symbol definitions for the library
   * @returns Library handle for function calls
   */
  loadLibrary(path: string, symbols: Record<string, FFISymbol>): LibraryHandle;

  /**
   * Call a function from the loaded library
   * @param handle Library handle
   * @param name Function name
   * @param args Function arguments
   * @returns Function result
   */
  callFunction(handle: LibraryHandle, name: string, ...args: any[]): any;

  /**
   * Allocate memory of specified size
   * @param size Size in bytes
   * @returns Memory buffer
   */
  allocateMemory(size: number): MemoryBuffer;

  /**
   * Free allocated memory
   * @param buffer Memory buffer to free
   */
  freeMemory(buffer: MemoryBuffer): void;

  /**
   * Create a pointer from an ArrayBuffer
   * @param buffer ArrayBuffer containing data
   * @returns Pointer to the buffer
   */
  createPointer(buffer: ArrayBuffer): Pointer;

  /**
   * Create a C string pointer from JavaScript string
   * @param str JavaScript string
   * @returns Pointer to null-terminated C string
   */
  createCString(str: string): Pointer;

  /**
   * Read a C string from a pointer
   * @param ptr Pointer to C string
   * @returns JavaScript string
   */
  readCString(ptr: Pointer): string;

  /**
   * Get the runtime name
   */
  getRuntimeName(): 'bun' | 'node' | 'deno';

  /**
   * Get file extension for shared libraries on this platform
   */
  getLibraryExtension(): string;
}

/**
 * Runtime detection result
 */
export interface RuntimeInfo {
  name: 'bun' | 'node' | 'deno' | 'unknown';
  version?: string;
  ffiSupported: boolean;
}

/**
 * FFI initialization options
 */
export interface FFIOptions {
  libraryPaths?: string[];
  preferredRuntime?: 'bun' | 'node' | 'deno';
  fallbackEnabled?: boolean;
}