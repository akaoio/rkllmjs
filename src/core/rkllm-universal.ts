/**
 * Universal RKLLM implementation
 * Provides the same API across all JavaScript runtimes using appropriate FFI adapters
 */

import type { 
  RKLLMParam, 
  RKLLMInput, 
  RKLLMResult, 
  StreamOptions, 
  RKLLMLoraAdapter 
} from '../types.js';
import { FFIManager } from './ffi-manager.js';
import { UniversalTypeConverter } from './universal-type-conversion.js';

/**
 * Universal RKLLM implementation using runtime-specific FFI adapters
 */
export class UniversalRKLLM {
  private ffiManager: FFIManager;
  private typeConverter: UniversalTypeConverter;
  private handle: any = null;
  private isInitialized = false;

  constructor() {
    this.ffiManager = new FFIManager();
    this.typeConverter = new UniversalTypeConverter(this.ffiManager);
  }

  /**
   * Initialize the LLM with the given parameters
   */
  async init(params: RKLLMParam): Promise<void> {
    if (this.isInitialized) {
      throw new Error('RKLLM is already initialized');
    }

    try {
      // Initialize FFI manager
      await this.ffiManager.initialize();

      // Create handle buffer
      const handleBuffer = this.ffiManager.allocateMemory(8);
      const handlePtr = handleBuffer.ptr;

      // Convert parameters to C structure
      const { buffer: paramBuffer, ptr: paramPtr } = this.typeConverter.createRKLLMParamStruct(params);

      // Create default callback pointer (simplified for now)
      const callbackPtr = null; // TODO: Implement callback creation

      // Call rkllm_init
      const result = this.ffiManager.callFunction('rkllm_init', handlePtr, paramPtr, callbackPtr);
      
      if (result !== 0) {
        throw new Error(`Failed to initialize RKLLM with error code: ${result}`);
      }

      // Read the handle value
      this.handle = handleBuffer.view.getBigUint64(0, true);
      this.isInitialized = true;

      // Clean up parameter buffer
      this.ffiManager.freeMemory(paramBuffer);

    } catch (error) {
      throw new Error(`Failed to initialize RKLLM: ${error}`);
    }
  }

  /**
   * Run inference with the given input
   */
  async run(input: RKLLMInput): Promise<RKLLMResult> {
    this.checkInitialized();

    try {
      // Convert input to C structure
      const { buffer: inputBuffer, ptr: inputPtr } = this.typeConverter.createRKLLMInputStruct(input);

      // Create inference parameters (simplified for now)
      const inferParamPtr = null; // TODO: Implement inference parameters

      // Create user data pointer
      const userdataPtr = null;

      // Call rkllm_run
      const result = this.ffiManager.callFunction('rkllm_run', this.handle, inputPtr, inferParamPtr, userdataPtr);
      
      if (result !== 0) {
        throw new Error(`Failed to run inference with error code: ${result}`);
      }

      // TODO: Parse result from the actual result structure
      // For now, return a placeholder result
      const rkllmResult: RKLLMResult = {
        text: 'Placeholder result - implementation needed',
        state: 2, // LLMCallState.FINISH
        tokens: [],
        logprobs: null
      };

      // Clean up input buffer
      this.ffiManager.freeMemory(inputBuffer);

      return rkllmResult;

    } catch (error) {
      throw new Error(`Failed to run inference: ${error}`);
    }
  }

  /**
   * Run streaming inference with callback
   */
  async runStream(input: RKLLMInput, options: StreamOptions): Promise<void> {
    this.checkInitialized();

    try {
      // Convert input to C structure
      const { buffer: inputBuffer, ptr: inputPtr } = this.typeConverter.createRKLLMInputStruct(input);

      // Create inference parameters (simplified for now)
      const inferParamPtr = null; // TODO: Implement inference parameters

      // Create user data pointer
      const userdataPtr = null;

      // Call rkllm_run_async (streaming version)
      const result = this.ffiManager.callFunction('rkllm_run_async', this.handle, inputPtr, inferParamPtr, userdataPtr);
      
      if (result !== 0) {
        throw new Error(`Failed to run streaming inference with error code: ${result}`);
      }

      // Clean up input buffer
      this.ffiManager.freeMemory(inputBuffer);

    } catch (error) {
      throw new Error(`Failed to run streaming inference: ${error}`);
    }
  }

  /**
   * Load a LoRA adapter
   */
  async loadLoRA(adapter: RKLLMLoraAdapter): Promise<void> {
    this.checkInitialized();

    try {
      // Convert adapter to C structure
      const { buffer: adapterBuffer, ptr: adapterPtr } = this.typeConverter.createRKLLMLoraAdapterStruct(adapter);

      // Call rkllm_load_lora
      const result = this.ffiManager.callFunction('rkllm_load_lora', this.handle, adapterPtr);
      
      if (result !== 0) {
        throw new Error(`Failed to load LoRA adapter with error code: ${result}`);
      }

      // Clean up adapter buffer
      this.ffiManager.freeMemory(adapterBuffer);

    } catch (error) {
      throw new Error(`Failed to load LoRA adapter: ${error}`);
    }
  }

  /**
   * Clear KV cache
   */
  async clearKVCache(keepSystemPrompt: boolean = false): Promise<void> {
    this.checkInitialized();

    try {
      // Create start and end position pointers
      const startPosBuffer = this.ffiManager.allocateMemory(4);
      const endPosBuffer = this.ffiManager.allocateMemory(4);
      
      startPosBuffer.view.setInt32(0, 0, true);
      endPosBuffer.view.setInt32(0, -1, true); // -1 means clear all

      const result = this.ffiManager.callFunction(
        'rkllm_clear_kv_cache', 
        this.handle, 
        keepSystemPrompt ? 1 : 0,
        startPosBuffer.ptr,
        endPosBuffer.ptr
      );
      
      if (result !== 0) {
        throw new Error(`Failed to clear KV cache with error code: ${result}`);
      }

      // Clean up buffers
      this.ffiManager.freeMemory(startPosBuffer);
      this.ffiManager.freeMemory(endPosBuffer);

    } catch (error) {
      throw new Error(`Failed to clear KV cache: ${error}`);
    }
  }

  /**
   * Get KV cache size
   */
  async getKVCacheSize(): Promise<number[]> {
    this.checkInitialized();

    try {
      // Create cache sizes buffer
      const cacheSizesBuffer = this.ffiManager.allocateMemory(16); // Assume 4 int32 values

      const result = this.ffiManager.callFunction('rkllm_get_kv_cache_size', this.handle, cacheSizesBuffer.ptr);
      
      if (result !== 0) {
        throw new Error(`Failed to get KV cache size with error code: ${result}`);
      }

      // Read cache sizes
      const sizes = [
        cacheSizesBuffer.view.getInt32(0, true),
        cacheSizesBuffer.view.getInt32(4, true),
        cacheSizesBuffer.view.getInt32(8, true),
        cacheSizesBuffer.view.getInt32(12, true),
      ];

      // Clean up buffer
      this.ffiManager.freeMemory(cacheSizesBuffer);

      return sizes;

    } catch (error) {
      throw new Error(`Failed to get KV cache size: ${error}`);
    }
  }

  /**
   * Set chat template
   */
  async setChatTemplate(systemPrompt: string, promptPrefix: string, promptPostfix: string): Promise<void> {
    this.checkInitialized();

    try {
      const systemPromptPtr = this.ffiManager.createCString(systemPrompt);
      const prefixPtr = this.ffiManager.createCString(promptPrefix);
      const postfixPtr = this.ffiManager.createCString(promptPostfix);

      const result = this.ffiManager.callFunction(
        'rkllm_set_chat_template', 
        this.handle, 
        systemPromptPtr, 
        prefixPtr, 
        postfixPtr
      );
      
      if (result !== 0) {
        throw new Error(`Failed to set chat template with error code: ${result}`);
      }

    } catch (error) {
      throw new Error(`Failed to set chat template: ${error}`);
    }
  }

  /**
   * Load prompt cache
   */
  async loadPromptCache(cachePath: string): Promise<void> {
    this.checkInitialized();

    try {
      const cachePathPtr = this.ffiManager.createCString(cachePath);

      const result = this.ffiManager.callFunction('rkllm_load_prompt_cache', this.handle, cachePathPtr);
      
      if (result !== 0) {
        throw new Error(`Failed to load prompt cache with error code: ${result}`);
      }

    } catch (error) {
      throw new Error(`Failed to load prompt cache: ${error}`);
    }
  }

  /**
   * Release prompt cache
   */
  async releasePromptCache(): Promise<void> {
    this.checkInitialized();

    try {
      const result = this.ffiManager.callFunction('rkllm_release_prompt_cache', this.handle);
      
      if (result !== 0) {
        throw new Error(`Failed to release prompt cache with error code: ${result}`);
      }

    } catch (error) {
      throw new Error(`Failed to release prompt cache: ${error}`);
    }
  }

  /**
   * Abort current inference
   */
  async abort(): Promise<void> {
    this.checkInitialized();

    try {
      const result = this.ffiManager.callFunction('rkllm_abort', this.handle);
      
      if (result !== 0) {
        throw new Error(`Failed to abort inference with error code: ${result}`);
      }

    } catch (error) {
      throw new Error(`Failed to abort inference: ${error}`);
    }
  }

  /**
   * Check if inference is running
   */
  async isRunning(): Promise<boolean> {
    this.checkInitialized();

    try {
      const result = this.ffiManager.callFunction('rkllm_is_running', this.handle);
      return result === 1;

    } catch (error) {
      throw new Error(`Failed to check running status: ${error}`);
    }
  }

  /**
   * Destroy the LLM instance
   */
  async destroy(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      const result = this.ffiManager.callFunction('rkllm_destroy', this.handle);
      
      if (result !== 0) {
        console.warn(`Warning: destroy returned error code ${result}`);
      }

      this.handle = null;
      this.isInitialized = false;
      this.ffiManager.destroy();

    } catch (error) {
      throw new Error(`Failed to destroy RKLLM: ${error}`);
    }
  }

  /**
   * Check if the LLM is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get the backend type
   */
  get backendType(): 'ffi' {
    return 'ffi';
  }

  /**
   * Get the current runtime name
   */
  get runtimeName(): string {
    return this.ffiManager.getRuntimeName();
  }

  /**
   * Check if initialized and throw error if not
   */
  private checkInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('RKLLM is not initialized. Call init() first.');
    }
  }
}