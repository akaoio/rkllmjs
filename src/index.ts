/**
 * RKLLMJS - JavaScript bindings for Rockchip LLM Runtime
 * High-performance interface for running LLMs on Rockchip NPUs
 */

export * from './types.js';
export * from './rkllm.js';
export { RKLLM, createRKLLM } from './rkllm.js';

// Version information
export const version = '0.1.0';

// Default export
export { RKLLM as default } from './rkllm.js';
