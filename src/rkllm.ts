import { RKLLMParam, RKLLMInput, RKLLMResult, StreamOptions, RKLLMLoraAdapter } from './types.js';
import { requireValidModelPath } from './utils/model-validator.js';
import { RKLLMFFIImpl } from './ffi/rkllm-ffi-impl.js';
import { UniversalRKLLM } from './core/rkllm-universal.js';
import { detectRuntime } from './runtime/detector.js';

/**
 * Main RKLLM class for interacting with Rockchip LLM Runtime
 * Supports multiple JavaScript runtimes with automatic adapter selection
 */
export class RKLLM {
  private backend: RKLLMFFIImpl | UniversalRKLLM | null = null;
  private useUniversal = false;

  /**
   * Initialize the LLM with the given parameters
   * @param params Configuration parameters for the LLM
   */
  async init(params: RKLLMParam): Promise<void> {
    if (this.backend?.initialized) {
      throw new Error('RKLLM is already initialized');
    }

    // Validate model path before attempting to initialize
    await requireValidModelPath(params.modelPath);
    
    try {
      // Detect runtime and choose appropriate implementation
      const runtime = detectRuntime();
      
      if (runtime.name === 'bun' && runtime.ffiSupported) {
        // Use original Bun FFI implementation for maximum performance
        this.backend = new RKLLMFFIImpl();
        this.useUniversal = false;
      } else {
        // Use universal implementation for other runtimes
        this.backend = new UniversalRKLLM();
        this.useUniversal = true;
      }
      
      await this.backend.init(params);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const backendType = this.useUniversal ? 'universal' : 'Bun FFI';
      throw new Error(`Failed to initialize RKLLM with ${backendType} backend: ${errorMessage}`);
    }
  }

  /**
   * Run inference with the given input
   * @param input Input data for inference
   * @returns Promise resolving to the inference result
   */
  async run(input: RKLLMInput): Promise<RKLLMResult> {
    this.checkInitialized();
    if (this.useUniversal) {
      return await (this.backend as UniversalRKLLM).run(input);
    } else {
      return await (this.backend as RKLLMFFIImpl).run(input);
    }
  }

  /**
   * Run streaming inference with callback
   * @param input Input data for inference
   * @param options Streaming options including callback
   */
  async runStream(input: RKLLMInput, options: StreamOptions): Promise<void> {
    this.checkInitialized();
    if (this.useUniversal) {
      return await (this.backend as UniversalRKLLM).runStream(input, options);
    } else {
      return await (this.backend as RKLLMFFIImpl).runStream(input, options);
    }
  }

  /**
   * Load a LoRA adapter
   * @param adapter LoRA adapter configuration
   */
  async loadLoraAdapter(adapter: RKLLMLoraAdapter): Promise<void> {
    this.checkInitialized();
    if (this.useUniversal) {
      return await (this.backend as UniversalRKLLM).loadLoRA(adapter);
    } else {
      return await (this.backend as RKLLMFFIImpl).loadLoRA(adapter);
    }
  }

  /**
   * Unload the current LoRA adapter
   * Note: FFI implementation doesn't have a direct unload method
   * You can load a new adapter to replace the current one
   */
  async unloadLoraAdapter(): Promise<void> {
    if (this.useUniversal) {
      throw new Error('LoRA adapter unloading not directly supported in universal implementation. Load a new adapter to replace the current one.');
    } else {
      throw new Error('LoRA adapter unloading not directly supported in FFI implementation. Load a new adapter to replace the current one.');
    }
  }

  /**
   * Get the current KV cache size
   */
  async getContextLength(): Promise<number[]> {
    this.checkInitialized();
    if (this.useUniversal) {
      return await (this.backend as UniversalRKLLM).getKVCacheSize();
    } else {
      return await (this.backend as RKLLMFFIImpl).getKVCacheSize();
    }
  }

  /**
   * Clear the current KV cache
   * @param keepSystemPrompt Whether to keep system prompt in cache
   */
  async clearContext(keepSystemPrompt: boolean = false): Promise<void> {
    this.checkInitialized();
    if (this.useUniversal) {
      return await (this.backend as UniversalRKLLM).clearKVCache(keepSystemPrompt);
    } else {
      return await (this.backend as RKLLMFFIImpl).clearKVCache(keepSystemPrompt);
    }
  }

  /**
   * Set chat template for the model
   * @param systemPrompt System prompt for the chat
   * @param promptPrefix Prefix for user prompts
   * @param promptPostfix Postfix for user prompts
   */
  async setChatTemplate(systemPrompt: string, promptPrefix: string, promptPostfix: string): Promise<void> {
    this.checkInitialized();
    if (this.useUniversal) {
      return await (this.backend as UniversalRKLLM).setChatTemplate(systemPrompt, promptPrefix, promptPostfix);
    } else {
      return await (this.backend as RKLLMFFIImpl).setChatTemplate(systemPrompt, promptPrefix, promptPostfix);
    }
  }

  /**
   * Load prompt cache from file
   * @param cachePath Path to the cache file
   */
  async loadPromptCache(cachePath: string): Promise<void> {
    this.checkInitialized();
    if (this.useUniversal) {
      return await (this.backend as UniversalRKLLM).loadPromptCache(cachePath);
    } else {
      return await (this.backend as RKLLMFFIImpl).loadPromptCache(cachePath);
    }
  }

  /**
   * Release prompt cache from memory
   */
  async releasePromptCache(): Promise<void> {
    this.checkInitialized();
    if (this.useUniversal) {
      return await (this.backend as UniversalRKLLM).releasePromptCache();
    } else {
      return await (this.backend as RKLLMFFIImpl).releasePromptCache();
    }
  }

  /**
   * Abort current inference operation
   */
  async abort(): Promise<void> {
    this.checkInitialized();
    if (this.useUniversal) {
      return await (this.backend as UniversalRKLLM).abort();
    } else {
      return await (this.backend as RKLLMFFIImpl).abort();
    }
  }

  /**
   * Check if inference is currently running
   */
  async isRunning(): Promise<boolean> {
    this.checkInitialized();
    if (this.useUniversal) {
      return await (this.backend as UniversalRKLLM).isRunning();
    } else {
      return await (this.backend as RKLLMFFIImpl).isRunning();
    }
  }

  /**
   * Destroy the LLM instance and free resources
   */
  async destroy(): Promise<void> {
    if (!this.backend?.initialized) {
      return;
    }

    await this.backend.destroy();
    this.backend = null;
  }

  /**
   * Check if the LLM is initialized
   */
  private checkInitialized(): void {
    if (!this.backend?.initialized) {
      throw new Error('RKLLM is not initialized. Call init() first.');
    }
  }

  /**
   * Check if the LLM is initialized
   */
  get initialized(): boolean {
    return this.backend?.initialized ?? false;
  }

  /**
   * Get the current backend type (always 'ffi')
   */
  get backendType(): 'ffi' | null {
    return this.backend ? 'ffi' : null;
  }

  /**
   * Get the current runtime name
   */
  get runtimeName(): string {
    if (!this.backend) {
      return 'unknown';
    }
    
    if (this.useUniversal) {
      return (this.backend as UniversalRKLLM).runtimeName;
    } else {
      return 'bun'; // Original implementation is Bun-only
    }
  }
}

/**
 * Utility function to create a new RKLLM instance
 * @param params Configuration parameters
 * @returns Promise resolving to initialized RKLLM instance
 */
export async function createRKLLM(params: RKLLMParam): Promise<RKLLM> {
  const llm = new RKLLM();
  await llm.init(params);
  return llm;
}
