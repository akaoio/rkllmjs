import { RKLLMParam, RKLLMInput, RKLLMResult, StreamOptions, RKLLMLoraAdapter } from './types.js';

/**
 * Main RKLLM class for interacting with Rockchip LLM Runtime
 * Supports multiple JavaScript runtimes with automatic adapter selection
 */
export class RKLLM {
  private backend: any = null;
  private useUniversal = false;
  private useMock = false;

  /**
   * Initialize the LLM with the given parameters
   * @param params Configuration parameters for the LLM
   * @param options Optional configuration including test mode
   */
  async init(params: RKLLMParam, options?: { mockMode?: boolean }): Promise<void> {
    if (this.backend?.initialized) {
      throw new Error('RKLLM is already initialized');
    }

    // Check if we should use mock mode (for testing)
    const mockMode = options?.mockMode || false;

    if (mockMode) {
      // Use mock implementation for testing
      const { RKLLMFFIMock } = await import('./ffi/rkllm-ffi-mock.js');
      this.backend = new RKLLMFFIMock();
      this.useMock = true;
      this.useUniversal = false;
      await this.backend.init(params);
      return;
    }

    // Validate model path before attempting to initialize (dynamic import)
    try {
      const { requireValidModelPath } = await import('./utils/model-validator.js');
      await requireValidModelPath(params.modelPath);
    } catch (error) {
      // Re-throw validation errors instead of just warning
      throw error;
    }
    
    try {
      // Dynamically import runtime detection to avoid compilation issues
      const { detectRuntime } = await import('./runtime/detector.js');
      const runtime = detectRuntime();
      
      if (runtime.name === 'bun' && runtime.ffiSupported) {
        // Use original Bun FFI implementation for maximum performance
        const { RKLLMFFIImpl } = await import('./ffi/rkllm-ffi-impl.js');
        this.backend = new RKLLMFFIImpl();
        this.useUniversal = false;
      } else {
        // Use universal implementation for other runtimes
        const { UniversalRKLLM } = await import('./core/rkllm-universal.js');
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
      return await this.backend.run(input);
    } else {
      return await this.backend.run(input);
    }
  }

  /**
   * Run streaming inference with callback
   * @param input Input data for inference
   * @param options Streaming options including callback
   */
  async runStream(input: RKLLMInput, options: StreamOptions): Promise<void> {
    this.checkInitialized();
    return await this.backend.runStream(input, options);
  }

  /**
   * Load a LoRA adapter
   * @param adapter LoRA adapter configuration
   */
  async loadLoraAdapter(adapter: RKLLMLoraAdapter): Promise<void> {
    this.checkInitialized();
    return await this.backend.loadLoRA(adapter);
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
    return await this.backend.getKVCacheSize();
  }

  /**
   * Clear the current KV cache
   * @param keepSystemPrompt Whether to keep system prompt in cache
   */
  async clearContext(keepSystemPrompt: boolean = false): Promise<void> {
    this.checkInitialized();
    return await this.backend.clearKVCache(keepSystemPrompt);
  }

  /**
   * Set chat template for the model
   * @param systemPrompt System prompt for the chat
   * @param promptPrefix Prefix for user prompts
   * @param promptPostfix Postfix for user prompts
   */
  async setChatTemplate(systemPrompt: string, promptPrefix: string, promptPostfix: string): Promise<void> {
    this.checkInitialized();
    return await this.backend.setChatTemplate(systemPrompt, promptPrefix, promptPostfix);
  }

  /**
   * Load prompt cache from file
   * @param cachePath Path to the cache file
   */
  async loadPromptCache(cachePath: string): Promise<void> {
    this.checkInitialized();
    return await this.backend.loadPromptCache(cachePath);
  }

  /**
   * Release prompt cache from memory
   */
  async releasePromptCache(): Promise<void> {
    this.checkInitialized();
    return await this.backend.releasePromptCache();
  }

  /**
   * Abort current inference operation
   */
  async abort(): Promise<void> {
    this.checkInitialized();
    return await this.backend.abort();
  }

  /**
   * Check if inference is currently running
   */
  async isRunning(): Promise<boolean> {
    this.checkInitialized();
    return await this.backend.isRunning();
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
   * Get the current backend type
   */
  get backendType(): 'ffi' | 'mock' | null {
    if (!this.backend) return null;
    if (this.useMock) return 'mock';
    return 'ffi';
  }

  /**
   * Get the current runtime name
   */
  get runtimeName(): string {
    if (!this.backend) {
      return 'unknown';
    }
    
    if (this.useMock) {
      return 'mock';
    }
    
    if (this.useUniversal) {
      return this.backend.runtimeName || 'unknown';
    } else {
      return 'bun'; // Original implementation is Bun-only
    }
  }
}

/**
 * Utility function to create a new RKLLM instance
 * @param params Configuration parameters
 * @param options Optional configuration including test mode
 * @returns Promise resolving to initialized RKLLM instance
 */
export async function createRKLLM(params: RKLLMParam, options?: { mockMode?: boolean }): Promise<RKLLM> {
  const llm = new RKLLM();
  await llm.init(params, options);
  return llm;
}
