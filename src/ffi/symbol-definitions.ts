/**
 * Universal RKLLM FFI symbol definitions
 * Defines all RKLLM library functions in a runtime-agnostic format
 */

import type { FFISymbol } from '../runtime/interfaces.js';

/**
 * Universal FFI symbol definitions for RKLLM library
 * Maps from Bun's FFIType to universal string representations
 */
export const RKLLM_SYMBOLS: Record<string, FFISymbol> = {
  // Core LLM functions
  rkllm_createDefaultParam: {
    returns: 'pointer',
    args: [],
  },
  rkllm_init: {
    returns: 'i32',
    args: ['pointer', 'pointer', 'pointer'], // handle*, param*, callback*
  },
  rkllm_destroy: {
    returns: 'i32',
    args: ['pointer'], // handle
  },
  rkllm_run: {
    returns: 'i32',
    args: ['pointer', 'pointer', 'pointer', 'pointer'], // handle, input*, infer_params*, userdata*
  },
  rkllm_run_async: {
    returns: 'i32',
    args: ['pointer', 'pointer', 'pointer', 'pointer'], // handle, input*, infer_params*, userdata*
  },
  rkllm_abort: {
    returns: 'i32',
    args: ['pointer'], // handle
  },
  rkllm_is_running: {
    returns: 'i32',
    args: ['pointer'], // handle
  },
  
  // LoRA functions
  rkllm_load_lora: {
    returns: 'i32',
    args: ['pointer', 'pointer'], // handle, lora_adapter*
  },
  
  // Cache functions
  rkllm_load_prompt_cache: {
    returns: 'i32',
    args: ['pointer', 'cstring'], // handle, cache_path
  },
  rkllm_release_prompt_cache: {
    returns: 'i32',
    args: ['pointer'], // handle
  },
  rkllm_clear_kv_cache: {
    returns: 'i32',
    args: ['pointer', 'i32', 'pointer', 'pointer'], // handle, keep_system_prompt, start_pos*, end_pos*
  },
  rkllm_get_kv_cache_size: {
    returns: 'i32',
    args: ['pointer', 'pointer'], // handle, cache_sizes*
  },
  
  // Configuration functions
  rkllm_set_chat_template: {
    returns: 'i32',
    args: ['pointer', 'cstring', 'cstring', 'cstring'], // handle, system_prompt, prefix, postfix
  },
  rkllm_set_function_tools: {
    returns: 'i32',
    args: ['pointer', 'cstring', 'cstring', 'cstring'], // handle, system_prompt, tools, tool_response_str
  },
  rkllm_set_cross_attn_params: {
    returns: 'i32',
    args: ['pointer', 'pointer'], // handle, cross_attn_params*
  },
} as const;

/**
 * Type mapping from universal types to runtime-specific types
 */
export interface TypeMappings {
  pointer: any;
  i32: any;
  i8: any;
  u32: any;
  u8: any;
  f32: any;
  f64: any;
  cstring: any;
  buffer: any;
}

/**
 * Get default library paths for different architectures
 */
export function getDefaultLibraryPaths(extension: string): string[] {
  return [
    `./libs/rkllm/aarch64/librkllmrt.${extension}`,
    `./libs/rkllm/armhf/librkllmrt.${extension}`,
    `/usr/lib/librkllmrt.${extension}`,
    `/usr/local/lib/librkllmrt.${extension}`,
    `librkllmrt.${extension}`,
  ];
}

/**
 * RKLLM function groups for validation and testing
 */
export const FUNCTION_GROUPS = {
  core: [
    'rkllm_createDefaultParam',
    'rkllm_init',
    'rkllm_destroy',
    'rkllm_run',
    'rkllm_run_async',
    'rkllm_abort',
    'rkllm_is_running',
  ],
  lora: [
    'rkllm_load_lora',
  ],
  cache: [
    'rkllm_load_prompt_cache',
    'rkllm_release_prompt_cache',
    'rkllm_clear_kv_cache',
    'rkllm_get_kv_cache_size',
  ],
  config: [
    'rkllm_set_chat_template',
    'rkllm_set_function_tools',
    'rkllm_set_cross_attn_params',
  ],
} as const;

/**
 * Validate that all required functions are available in a library
 */
export function validateLibraryFunctions(
  librarySymbols: Record<string, any>,
  requiredGroups: Array<keyof typeof FUNCTION_GROUPS> = ['core']
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  for (const group of requiredGroups) {
    for (const functionName of FUNCTION_GROUPS[group]) {
      if (!(functionName in librarySymbols)) {
        missing.push(functionName);
      }
    }
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}