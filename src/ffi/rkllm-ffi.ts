/**
 * Bun.FFI bindings for Rockchip LLM Runtime
 * Direct interface to the native RKLLM library using Bun's Foreign Function Interface
 */

import { dlopen, FFIType, suffix } from "bun:ffi";
import type { 
  RKLLMParam, 
  RKLLMInput, 
  RKLLMResult, 
  RKLLMInferMode,
  RKLLMInputType,
  LLMCallState,
  RKLLMLoraAdapter,
  RKLLMExtendParam
} from '../types.js';

/**
 * FFI symbol definitions for the RKLLM library
 */
const symbols = {
  // Core LLM functions
  rkllm_createDefaultParam: {
    returns: FFIType.ptr,
    args: [],
  },
  rkllm_init: {
    returns: FFIType.i32,
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], // handle*, param*, callback*
  },
  rkllm_destroy: {
    returns: FFIType.i32,
    args: [FFIType.ptr], // handle
  },
  rkllm_run: {
    returns: FFIType.i32,
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], // handle, input*, infer_params*, userdata*
  },
  rkllm_run_async: {
    returns: FFIType.i32,
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], // handle, input*, infer_params*, userdata*
  },
  rkllm_abort: {
    returns: FFIType.i32,
    args: [FFIType.ptr], // handle
  },
  rkllm_is_running: {
    returns: FFIType.i32,
    args: [FFIType.ptr], // handle
  },
  
  // LoRA functions
  rkllm_load_lora: {
    returns: FFIType.i32,
    args: [FFIType.ptr, FFIType.ptr], // handle, lora_adapter*
  },
  
  // Cache functions
  rkllm_load_prompt_cache: {
    returns: FFIType.i32,
    args: [FFIType.ptr, FFIType.cstring], // handle, cache_path
  },
  rkllm_release_prompt_cache: {
    returns: FFIType.i32,
    args: [FFIType.ptr], // handle
  },
  rkllm_clear_kv_cache: {
    returns: FFIType.i32,
    args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], // handle, keep_system_prompt, start_pos*, end_pos*
  },
  rkllm_get_kv_cache_size: {
    returns: FFIType.i32,
    args: [FFIType.ptr, FFIType.ptr], // handle, cache_sizes*
  },
  
  // Configuration functions
  rkllm_set_chat_template: {
    returns: FFIType.i32,
    args: [FFIType.ptr, FFIType.cstring, FFIType.cstring, FFIType.cstring], // handle, system_prompt, prefix, postfix
  },
  rkllm_set_function_tools: {
    returns: FFIType.i32,
    args: [FFIType.ptr, FFIType.cstring, FFIType.cstring, FFIType.cstring], // handle, system_prompt, tools, tool_response_str
  },
  rkllm_set_cross_attn_params: {
    returns: FFIType.i32,
    args: [FFIType.ptr, FFIType.ptr], // handle, cross_attn_params*
  },
} as const;

/**
 * Dynamic library instance
 */
let lib: any = null;

/**
 * Initialize the FFI library
 */
export function initializeFFI(): boolean {
  // Skip FFI initialization in test mode to prevent segfaults
  if (process.env.NODE_ENV === 'test' || process.env.RKLLMJS_TEST_MODE === 'true') {
    console.warn('Skipping FFI initialization in test mode');
    return false;
  }

  try {
    // Try to load the library from different possible locations
    const possiblePaths = [
      `./libs/rkllm/aarch64/librkllmrt.${suffix}`,
      `./libs/rkllm/armhf/librkllmrt.${suffix}`,
      `/usr/lib/librkllmrt.${suffix}`,
      `/usr/local/lib/librkllmrt.${suffix}`,
      `librkllmrt.${suffix}`,
    ];

    for (const path of possiblePaths) {
      try {
        lib = dlopen(path, symbols);
        console.log(`Successfully loaded RKLLM library from: ${path}`);
        return true;
      } catch (error) {
        console.debug(`Failed to load RKLLM library from ${path}:`, error);
        continue;
      }
    }
    
    throw new Error('Could not load RKLLM library from any location');
  } catch (error) {
    console.error('Failed to initialize FFI:', error);
    return false;
  }
}

/**
 * Check if FFI is available and initialized
 */
export function isFFIAvailable(): boolean {
  // Return false in test mode to prevent native library calls
  if (process.env.NODE_ENV === 'test' || process.env.RKLLMJS_TEST_MODE === 'true') {
    return false;
  }
  
  return lib !== null && typeof lib === 'object' && 'symbols' in lib;
}

/**
 * Get the FFI library instance
 */
export function getFFILib() {
  if (!isFFIAvailable()) {
    throw new Error('FFI library not initialized. Call initializeFFI() first.');
  }
  return lib;
}

/**
 * Check if we're running in Bun environment
 */
export function isBunRuntime(): boolean {
  return typeof Bun !== 'undefined' && typeof Bun.version === 'string';
}