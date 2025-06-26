/**
 * Runtime detection and adapter factory
 * Detects the current JavaScript runtime and provides appropriate FFI adapters
 */

import type { RuntimeInfo, RuntimeFFI, FFIOptions } from './interfaces.js';

/**
 * Detect the current JavaScript runtime
 */
export function detectRuntime(): RuntimeInfo {
  // Check for Bun
  if (typeof globalThis.Bun !== 'undefined' && typeof globalThis.Bun.version === 'string') {
    return {
      name: 'bun',
      version: globalThis.Bun.version,
      ffiSupported: typeof globalThis.Bun.dlopen === 'function'
    };
  }

  // Check for Deno
  if (typeof globalThis.Deno !== 'undefined' && typeof globalThis.Deno.version === 'object') {
    return {
      name: 'deno',
      version: globalThis.Deno.version.deno,
      ffiSupported: typeof globalThis.Deno.dlopen === 'function'
    };
  }

  // Check for Node.js
  if (typeof globalThis.process !== 'undefined' && 
      globalThis.process.versions && 
      globalThis.process.versions.node) {
    return {
      name: 'node',
      version: globalThis.process.versions.node,
      ffiSupported: false // Will be determined by adapter availability
    };
  }

  return {
    name: 'unknown',
    ffiSupported: false
  };
}

/**
 * Create appropriate FFI adapter for the current runtime
 */
export async function createFFIAdapter(options: FFIOptions = {}): Promise<RuntimeFFI> {
  const runtime = detectRuntime();
  const preferredRuntime = options.preferredRuntime || runtime.name;

  // Try preferred runtime first
  if (preferredRuntime !== 'unknown') {
    try {
      const adapter = await loadAdapter(preferredRuntime);
      if (adapter.isAvailable()) {
        return adapter;
      }
    } catch (error) {
      if (!options.fallbackEnabled) {
        throw new Error(`Failed to load ${preferredRuntime} adapter: ${error}`);
      }
    }
  }

  // Fallback to detected runtime
  if (runtime.name !== 'unknown' && runtime.name !== preferredRuntime) {
    try {
      const adapter = await loadAdapter(runtime.name);
      if (adapter.isAvailable()) {
        return adapter;
      }
    } catch (error) {
      // Continue to other runtimes
    }
  }

  // Try all available runtimes
  const runtimeOrder: Array<'bun' | 'node' | 'deno'> = ['bun', 'deno', 'node'];
  
  for (const runtimeName of runtimeOrder) {
    if (runtimeName === preferredRuntime || runtimeName === runtime.name) {
      continue; // Already tried
    }

    try {
      const adapter = await loadAdapter(runtimeName);
      if (adapter.isAvailable()) {
        return adapter;
      }
    } catch (error) {
      // Continue to next runtime
    }
  }

  throw new Error(`No compatible FFI adapter found. Supported runtimes: Bun (preferred), Node.js, Deno`);
}

/**
 * Load a specific runtime adapter
 */
async function loadAdapter(runtime: 'bun' | 'node' | 'deno'): Promise<RuntimeFFI> {
  switch (runtime) {
    case 'bun':
      const { BunFFIAdapter } = await import('./adapters/bun-adapter.js');
      return new BunFFIAdapter();
    
    case 'node':
      const { NodeFFIAdapter } = await import('./adapters/node-adapter.js');
      return new NodeFFIAdapter();
    
    case 'deno':
      const { DenoFFIAdapter } = await import('./adapters/deno-adapter.js');
      return new DenoFFIAdapter();
    
    default:
      throw new Error(`Unsupported runtime: ${runtime}`);
  }
}

/**
 * Validate runtime compatibility
 */
export function validateRuntimeCompatibility(): { compatible: boolean; issues: string[] } {
  const runtime = detectRuntime();
  const issues: string[] = [];

  if (runtime.name === 'unknown') {
    issues.push('Unknown JavaScript runtime detected');
    return { compatible: false, issues };
  }

  if (!runtime.ffiSupported) {
    switch (runtime.name) {
      case 'node':
        issues.push('Node.js detected - FFI support requires additional packages (koffi or node-ffi-napi)');
        break;
      case 'bun':
        issues.push('Bun detected but FFI API not available - please update to Bun 1.0+');
        break;
      case 'deno':
        issues.push('Deno detected but FFI API not available - please update to Deno 1.25+');
        break;
    }
  }

  return {
    compatible: issues.length === 0,
    issues
  };
}

/**
 * Get runtime information for debugging
 */
export function getRuntimeInfo(): RuntimeInfo & { 
  userAgent?: string; 
  platform?: string; 
  arch?: string; 
} {
  const runtime = detectRuntime();
  
  const info: any = { ...runtime };

  // Add platform information
  if (typeof globalThis.process !== 'undefined') {
    info.platform = globalThis.process.platform;
    info.arch = globalThis.process.arch;
  }

  if (typeof globalThis.navigator !== 'undefined') {
    info.userAgent = globalThis.navigator.userAgent;
  }

  if (typeof globalThis.Deno !== 'undefined') {
    info.platform = globalThis.Deno.build.os;
    info.arch = globalThis.Deno.build.arch;
  }

  return info;
}