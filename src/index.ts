/**
 * RKLLMJS - JavaScript bindings for Rockchip LLM Runtime
 * High-performance interface for running LLMs on Rockchip NPUs
 * Supports multiple JavaScript runtimes: Bun, Node.js, Deno
 */

export * from './types.js';
export * from './rkllm.js';
export { RKLLM, createRKLLM } from './rkllm.js';

// Universal runtime exports
export { 
  detectRuntime,
  createFFIAdapter,
  getFFIAdapter,
  getFFIInfo
} from './runtime/factory.js';

// Legacy FFI-specific exports (for backward compatibility)
export { 
  initializeFFI, 
  isFFIAvailable, 
  isBunRuntime 
} from './core/ffi-manager.js';

// Version information
export const version = '0.1.0';

// Default export
export { RKLLM as default } from './rkllm.js';
