/**
 * RKLLM implementation using Bun.FFI
 * Provides the same API as the N-API version but uses Bun's FFI directly
 */

import { ptr } from "bun:ffi";
import { 
  initializeFFI, 
  isFFIAvailable, 
  getFFILib, 
  isBunRuntime 
} from './rkllm-ffi.js';
import {
  createRKLLMParamStruct,
  createRKLLMInputStruct,
  createRKLLMLoraAdapterStruct,
  parseRKLLMResult,
  createCallbackPointer,
  getBufferPointer
} from './type-conversion.js';
import type { 
  RKLLMParam, 
  RKLLMInput, 
  RKLLMResult, 
  RKLLMLoraAdapter,
  StreamOptions,
  LLMCallState 
} from '../types.js';

/**
 * FFI-based RKLLM implementation
 */
export class RKLLMFFIImpl {
  private handle: number | null = null;
  private isInitialized = false;
  private lib: any = null;

  constructor() {
    if (!isBunRuntime()) {
      throw new Error('RKLLM FFI implementation is only available in Bun runtime');
    }
  }

  /**
   * Initialize the LLM with the given parameters
   * @param params Configuration parameters for the LLM
   */
  async init(params: RKLLMParam): Promise<void> {
    if (this.isInitialized) {
      throw new Error('RKLLM is already initialized');
    }

    // Initialize FFI if not already done
    if (!isFFIAvailable()) {
      const success = initializeFFI();
      if (!success) {
        throw new Error('Failed to initialize FFI library');
      }
    }

    this.lib = getFFILib();

    try {
      // Create parameter structure
      const paramBuffer = createRKLLMParamStruct(params);
      const paramPtr = getBufferPointer(paramBuffer);

      // Allocate handle pointer
      const handleBuffer = new ArrayBuffer(8);
      const handlePtr = getBufferPointer(handleBuffer);

      // Create callback (placeholder for now)
      const callbackPtr = createCallbackPointer((result, userdata, state) => {
        // Default callback implementation
        return 0; // Continue inference
      });

      // Call rkllm_init
      const result = this.lib.symbols.rkllm_init(handlePtr, paramPtr, callbackPtr);
      
      if (result !== 0) {
        throw new Error(`Failed to initialize RKLLM with error code: ${result}`);
      }

      // Read the handle value
      const handleView = new DataView(handleBuffer);
      this.handle = Number(handleView.getBigUint64(0, true));
      this.isInitialized = true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize RKLLM: ${errorMessage}`);
    }
  }

  /**
   * Run inference with the given input
   * @param input Input data for inference
   * @returns Promise resolving to the inference result
   */
  async run(input: RKLLMInput): Promise<RKLLMResult> {
    this.checkInitialized();

    try {
      // Create input structure
      const inputBuffer = createRKLLMInputStruct(input);
      const inputPtr = getBufferPointer(inputBuffer);

      // Create basic inference parameters (simplified)
      const inferParamsBuffer = new ArrayBuffer(64);
      const inferParamsView = new DataView(inferParamsBuffer);
      inferParamsView.setInt32(0, 0, true); // RKLLM_INFER_GENERATE
      const inferParamsPtr = getBufferPointer(inferParamsBuffer);

      // Call rkllm_run
      const result = this.lib.symbols.rkllm_run(
        this.handle,
        inputPtr,
        inferParamsPtr,
        0 // userdata
      );

      if (result !== 0) {
        throw new Error(`Failed to run inference with error code: ${result}`);
      }

      // For now, return a basic result
      // In a real implementation, the result would be populated by the callback
      return {
        text: "Generated text placeholder", // This would come from the callback
        state: 2 as LLMCallState, // RKLLM_RUN_FINISH
        tokens: undefined,
        logits: undefined,
        hiddenStates: undefined,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to run inference: ${errorMessage}`);
    }
  }

  /**
   * Run streaming inference with callback
   * @param input Input data for inference
   * @param options Streaming options including callback
   */
  async runStream(input: RKLLMInput, options: StreamOptions): Promise<void> {
    this.checkInitialized();

    try {
      // Create input structure
      const inputBuffer = createRKLLMInputStruct(input);
      const inputPtr = getBufferPointer(inputBuffer);

      // Create inference parameters for async mode
      const inferParamsBuffer = new ArrayBuffer(64);
      const inferParamsView = new DataView(inferParamsBuffer);
      inferParamsView.setInt32(0, 0, true); // RKLLM_INFER_GENERATE
      const inferParamsPtr = getBufferPointer(inferParamsBuffer);

      // Create callback that forwards to user callback
      const callbackPtr = createCallbackPointer((result, userdata, state) => {
        try {
          options.callback(result, options.userdata);
          return state === 2 ? 1 : 0; // Stop if finished, continue otherwise
        } catch (error) {
          console.error('Callback error:', error);
          return 1; // Stop on error
        }
      });

      // Call rkllm_run_async
      const result = this.lib.symbols.rkllm_run_async(
        this.handle,
        inputPtr,
        inferParamsPtr,
        0 // userdata
      );

      if (result !== 0) {
        throw new Error(`Failed to start async inference with error code: ${result}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to run streaming inference: ${errorMessage}`);
    }
  }

  /**
   * Load a LoRA adapter
   * @param adapter LoRA adapter configuration
   */
  async loadLoRA(adapter: RKLLMLoraAdapter): Promise<void> {
    this.checkInitialized();

    try {
      const adapterBuffer = createRKLLMLoraAdapterStruct(adapter);
      const adapterPtr = getBufferPointer(adapterBuffer);

      const result = this.lib.symbols.rkllm_load_lora(this.handle, adapterPtr);

      if (result !== 0) {
        throw new Error(`Failed to load LoRA adapter with error code: ${result}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load LoRA adapter: ${errorMessage}`);
    }
  }

  /**
   * Load prompt cache from file
   * @param cachePath Path to the cache file
   */
  async loadPromptCache(cachePath: string): Promise<void> {
    this.checkInitialized();

    try {
      const result = this.lib.symbols.rkllm_load_prompt_cache(this.handle, cachePath);

      if (result !== 0) {
        throw new Error(`Failed to load prompt cache with error code: ${result}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load prompt cache: ${errorMessage}`);
    }
  }

  /**
   * Release prompt cache from memory
   */
  async releasePromptCache(): Promise<void> {
    this.checkInitialized();

    try {
      const result = this.lib.symbols.rkllm_release_prompt_cache(this.handle);

      if (result !== 0) {
        throw new Error(`Failed to release prompt cache with error code: ${result}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to release prompt cache: ${errorMessage}`);
    }
  }

  /**
   * Clear key-value cache
   * @param keepSystemPrompt Whether to keep system prompt in cache
   */
  async clearKVCache(keepSystemPrompt: boolean = false): Promise<void> {
    this.checkInitialized();

    try {
      const result = this.lib.symbols.rkllm_clear_kv_cache(
        this.handle,
        keepSystemPrompt ? 1 : 0,
        0, // start_pos (null)
        0  // end_pos (null)
      );

      if (result !== 0) {
        throw new Error(`Failed to clear KV cache with error code: ${result}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to clear KV cache: ${errorMessage}`);
    }
  }

  /**
   * Get KV cache size
   * @returns Array of cache sizes per batch
   */
  async getKVCacheSize(): Promise<number[]> {
    this.checkInitialized();

    try {
      // Allocate buffer for cache sizes (assuming max 8 batches)
      const cacheSizesBuffer = new Int32Array(8);
      const cacheSizesPtr = ptr(cacheSizesBuffer);

      const result = this.lib.symbols.rkllm_get_kv_cache_size(this.handle, cacheSizesPtr);

      if (result !== 0) {
        throw new Error(`Failed to get KV cache size with error code: ${result}`);
      }

      // Return the cache sizes (first non-zero values)
      const sizes: number[] = [];
      for (let i = 0; i < cacheSizesBuffer.length; i++) {
        if (cacheSizesBuffer[i] > 0) {
          sizes.push(cacheSizesBuffer[i]);
        } else {
          break;
        }
      }

      return sizes;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get KV cache size: ${errorMessage}`);
    }
  }

  /**
   * Set chat template
   * @param systemPrompt System prompt
   * @param promptPrefix Prompt prefix
   * @param promptPostfix Prompt postfix
   */
  async setChatTemplate(
    systemPrompt: string,
    promptPrefix: string,
    promptPostfix: string
  ): Promise<void> {
    this.checkInitialized();

    try {
      const result = this.lib.symbols.rkllm_set_chat_template(
        this.handle,
        systemPrompt,
        promptPrefix,
        promptPostfix
      );

      if (result !== 0) {
        throw new Error(`Failed to set chat template with error code: ${result}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to set chat template: ${errorMessage}`);
    }
  }

  /**
   * Abort current inference
   */
  async abort(): Promise<void> {
    this.checkInitialized();

    try {
      const result = this.lib.symbols.rkllm_abort(this.handle);

      if (result !== 0) {
        throw new Error(`Failed to abort inference with error code: ${result}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to abort inference: ${errorMessage}`);
    }
  }

  /**
   * Check if inference is currently running
   * @returns True if running, false otherwise
   */
  async isRunning(): Promise<boolean> {
    this.checkInitialized();

    try {
      const result = this.lib.symbols.rkllm_is_running(this.handle);
      return result === 0; // 0 means running

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to check running status: ${errorMessage}`);
    }
  }

  /**
   * Destroy the LLM instance and free resources
   */
  async destroy(): Promise<void> {
    if (!this.isInitialized || !this.handle) {
      return;
    }

    try {
      const result = this.lib.symbols.rkllm_destroy(this.handle);
      
      if (result !== 0) {
        console.warn(`Warning: destroy returned error code ${result}`);
      }

      this.handle = null;
      this.lib = null;
      this.isInitialized = false;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to destroy RKLLM: ${errorMessage}`);
    }
  }

  /**
   * Check if the LLM is initialized
   */
  private checkInitialized(): void {
    if (!this.isInitialized || !this.handle || !this.lib) {
      throw new Error('RKLLM is not initialized. Call init() first.');
    }
  }

  /**
   * Check if the LLM is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }
}