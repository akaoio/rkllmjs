/**
 * RKLLMJS - JavaScript bindings for Rockchip LLM Runtime
 * High-performance interface for running LLMs on Rockchip NPUs
 * Supports multiple JavaScript runtimes: Bun, Node.js, Deno
 */

export * from './types.js';
export * from './rkllm.js';
export { RKLLM, createRKLLM } from './rkllm.js';

// Universal runtime exports - provide both sync and async versions
export { detectRuntime, validateRuntimeCompatibility, getRuntimeInfo } from './runtime/detector.js';
export { getFFIInfo } from './runtime/factory.js';
export { isBunRuntime } from './core/ffi-manager.js';

// Async exports
export async function createFFIAdapter(options: any = {}) {
  const { createFFIAdapter: _createFFIAdapter } = await import('./runtime/detector.js');
  return _createFFIAdapter(options);
}

export async function getFFIAdapter(options: any = {}) {
  const { getFFIAdapter: _getFFIAdapter } = await import('./runtime/factory.js');
  return _getFFIAdapter(options);
}

// Legacy FFI-specific exports (for backward compatibility)
export async function initializeFFI(preferredRuntime?: 'bun' | 'node' | 'deno') {
  const { initializeFFI: _initializeFFI } = await import('./core/ffi-manager.js');
  return _initializeFFI(preferredRuntime);
}

export async function isFFIAvailable() {
  const { isFFIAvailable: _isFFIAvailable } = await import('./core/ffi-manager.js');
  return _isFFIAvailable();
}

// Version information
export const version = '0.1.0';

// Default export
export { RKLLM as default } from './rkllm.js';
