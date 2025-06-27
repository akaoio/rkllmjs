/**
 * Runtime adapter factory
 * Creates appropriate FFI adapters based on the current runtime environment
 */

import type { RuntimeFFI, FFIOptions } from './interfaces.js';
import { detectRuntime, createFFIAdapter } from './detector.js';

export { detectRuntime, createFFIAdapter };
export * from './interfaces.js';

/**
 * Convenience function to get a ready-to-use FFI adapter
 * @param options FFI initialization options
 * @returns Promise resolving to initialized FFI adapter
 */
export async function getFFIAdapter(options: FFIOptions = {}): Promise<RuntimeFFI> {
  const adapter = await createFFIAdapter(options);
  
  if (!adapter.isAvailable()) {
    throw new Error(`FFI adapter for ${adapter.getRuntimeName()} is not available`);
  }
  
  return adapter;
}

/**
 * Get information about the current runtime and FFI support
 */
export function getFFIInfo() {
  const runtime = detectRuntime();
  
  return {
    runtime: runtime.name,
    version: runtime.version,
    ffiSupported: runtime.ffiSupported,
    libraryExtension: (() => {
      if (typeof process !== 'undefined') {
        switch (process.platform) {
          case 'win32': return 'dll';
          case 'darwin': return 'dylib';
          default: return 'so';
        }
      }
      if (typeof (globalThis as any).Deno !== 'undefined') {
        switch ((globalThis as any).Deno.build.os) {
          case 'windows': return 'dll';
          case 'darwin': return 'dylib';
          default: return 'so';
        }
      }
      return 'so';
    })()
  };
}