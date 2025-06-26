/**
 * Universal FFI Manager
 * Manages FFI operations across different JavaScript runtimes
 */

import type { RuntimeFFI, LibraryHandle, MemoryBuffer } from '../runtime/interfaces.js';
import { getFFIAdapter } from '../runtime/factory.js';
import { RKLLM_SYMBOLS, getDefaultLibraryPaths, validateLibraryFunctions } from '../ffi/symbol-definitions.js';

/**
 * Universal FFI Manager for RKLLM operations
 */
export class FFIManager {
  private adapter: RuntimeFFI | null = null;
  private library: LibraryHandle | null = null;
  private initialized = false;

  /**
   * Initialize the FFI manager with the appropriate adapter
   */
  async initialize(options: { preferredRuntime?: 'bun' | 'node' | 'deno' } = {}): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Get appropriate FFI adapter
      this.adapter = await getFFIAdapter({
        preferredRuntime: options.preferredRuntime,
        fallbackEnabled: true
      });

      // Load the RKLLM library
      await this.loadLibrary();
      
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize FFI manager: ${error}`);
    }
  }

  /**
   * Load the RKLLM library using the current adapter
   */
  private async loadLibrary(): Promise<void> {
    if (!this.adapter) {
      throw new Error('FFI adapter not initialized');
    }

    const extension = this.adapter.getLibraryExtension();
    const possiblePaths = getDefaultLibraryPaths(extension);

    let lastError: Error | null = null;

    for (const path of possiblePaths) {
      try {
        this.library = this.adapter.loadLibrary(path, RKLLM_SYMBOLS);
        
        // Validate that all required functions are available
        const validation = validateLibraryFunctions(this.library.symbols, ['core']);
        if (!validation.valid) {
          throw new Error(`Missing required functions: ${validation.missing.join(', ')}`);
        }

        console.log(`Successfully loaded RKLLM library from: ${path}`);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.debug(`Failed to load RKLLM library from ${path}:`, error);
        continue;
      }
    }

    throw new Error(`Could not load RKLLM library from any location. Last error: ${lastError?.message}`);
  }

  /**
   * Call a function from the loaded library
   */
  callFunction(name: string, ...args: any[]): any {
    if (!this.initialized || !this.adapter || !this.library) {
      throw new Error('FFI manager not initialized');
    }

    return this.adapter.callFunction(this.library, name, ...args);
  }

  /**
   * Allocate memory for FFI operations
   */
  allocateMemory(size: number): MemoryBuffer {
    if (!this.adapter) {
      throw new Error('FFI adapter not initialized');
    }

    return this.adapter.allocateMemory(size);
  }

  /**
   * Free allocated memory
   */
  freeMemory(buffer: MemoryBuffer): void {
    if (!this.adapter) {
      throw new Error('FFI adapter not initialized');
    }

    this.adapter.freeMemory(buffer);
  }

  /**
   * Create a pointer from an ArrayBuffer
   */
  createPointer(buffer: ArrayBuffer): any {
    if (!this.adapter) {
      throw new Error('FFI adapter not initialized');
    }

    return this.adapter.createPointer(buffer);
  }

  /**
   * Create a C string pointer
   */
  createCString(str: string): any {
    if (!this.adapter) {
      throw new Error('FFI adapter not initialized');
    }

    return this.adapter.createCString(str);
  }

  /**
   * Read a C string from a pointer
   */
  readCString(ptr: any): string {
    if (!this.adapter) {
      throw new Error('FFI adapter not initialized');
    }

    return this.adapter.readCString(ptr);
  }

  /**
   * Get the current runtime name
   */
  getRuntimeName(): 'bun' | 'node' | 'deno' | 'unknown' {
    if (!this.adapter) {
      return 'unknown';
    }

    return this.adapter.getRuntimeName();
  }

  /**
   * Check if the manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.library?.close) {
      this.library.close();
    }
    
    this.library = null;
    this.adapter = null;
    this.initialized = false;
  }
}

/**
 * Global FFI manager instance
 */
let globalFFIManager: FFIManager | null = null;

/**
 * Get the global FFI manager instance
 */
export async function getGlobalFFIManager(): Promise<FFIManager> {
  if (!globalFFIManager) {
    globalFFIManager = new FFIManager();
    await globalFFIManager.initialize();
  }
  
  return globalFFIManager;
}

/**
 * Check if FFI is available in the current runtime
 */
export async function isFFIAvailable(): Promise<boolean> {
  try {
    const manager = await getGlobalFFIManager();
    return manager.isInitialized();
  } catch (error) {
    return false;
  }
}

/**
 * Check if we're running in Bun (for backward compatibility)
 */
export function isBunRuntime(): boolean {
  return typeof globalThis.Bun !== 'undefined' && typeof globalThis.Bun.version === 'string';
}

/**
 * Initialize FFI with preferred runtime (for backward compatibility)
 */
export async function initializeFFI(preferredRuntime?: 'bun' | 'node' | 'deno'): Promise<boolean> {
  try {
    if (!globalFFIManager) {
      globalFFIManager = new FFIManager();
    }
    
    await globalFFIManager.initialize({ preferredRuntime });
    return true;
  } catch (error) {
    console.error('Failed to initialize FFI:', error);
    return false;
  }
}