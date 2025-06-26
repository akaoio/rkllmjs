#!/usr/bin/env bun

/**
 * RKLLMJS Model Management Tool - Redirected to modular implementation
 * 
 * This file now redirects to the modular implementation in src/tools/
 * 
 * Usage:
 *   bun tools.ts pull [repo] [filename]           - Download specified RKLLM model + essential technical files
 *   bun tools.ts list                             - List all downloaded models
 *   bun tools.ts info [model-name]                - Show model information
 *   bun tools.ts remove [model-name]              - Remove a model
 *   bun tools.ts clean                            - Clean all models
 * 
 * Examples:
 *   bun tools.ts pull limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4 Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm
 *   bun tools.ts pull punchnox/Tinnyllama-1.1B-rk3588-rkllm-1.1.4 TinyLlama-1.1B-Chat-v1.0-rk3588-w8a8-opt-0-hybrid-ratio-0.5.rkllm
 */

// Import and re-export everything from the modular implementation
export { RKLLMModelManager } from './src/tools/model-manager';
export { ModelInfo } from './src/tools/types';

// Import and run the CLI
import './src/tools/index';