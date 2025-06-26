import { RKLLMParam, RKLLMInput, RKLLMResult, StreamOptions, RKLLMLoraAdapter } from './types.js';
import { requireValidModelPath } from './utils/model-validator.js';
import { RKLLMFFIImpl } from './ffi/rkllm-ffi-impl.js';

/**
 * Main RKLLM class for interacting with Rockchip LLM Runtime
 * Uses Bun.FFI for native bindings exclusively
 */
export class RKLLM {
  private backend: RKLLMFFIImpl | null = null;

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
      this.backend = new RKLLMFFIImpl();
      await this.backend.init(params);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize RKLLM with FFI backend: ${errorMessage}`);
    }
  }

  /**
   * Run inference with the given input
   * @param input Input data for inference
   * @returns Promise resolving to the inference result
   */
  async run(input: RKLLMInput): Promise<RKLLMResult> {
    this.checkInitialized();
    return await this.backend!.run(input);
  }

  /**
   * Run streaming inference with callback
   * @param input Input data for inference
   * @param options Streaming options including callback
   */
  async runStream(input: RKLLMInput, options: StreamOptions): Promise<void> {
    this.checkInitialized();
    return await this.backend!.runStream(input, options);
  }

  /**
   * Load a LoRA adapter
   * @param adapter LoRA adapter configuration
   */
  async loadLoraAdapter(adapter: RKLLMLoraAdapter): Promise<void> {
    this.checkInitialized();
    return await this.backend!.loadLoRA(adapter);
  }

  /**
   * Unload the current LoRA adapter
   * Note: FFI implementation doesn't have a direct unload method
   * You can load a new adapter to replace the current one
   */
  async unloadLoraAdapter(): Promise<void> {
    throw new Error('LoRA adapter unloading not directly supported in FFI implementation. Load a new adapter to replace the current one.');
  }

  /**
   * Get the current KV cache size
   */
  async getContextLength(): Promise<number[]> {
    this.checkInitialized();
    return await this.backend!.getKVCacheSize();
  }

  /**
   * Clear the current KV cache
   * @param keepSystemPrompt Whether to keep system prompt in cache
   */
  async clearContext(keepSystemPrompt: boolean = false): Promise<void> {
    this.checkInitialized();
    return await this.backend!.clearKVCache(keepSystemPrompt);
  }

  /**
   * Set chat template for the model
   * @param systemPrompt System prompt for the chat
   * @param promptPrefix Prefix for user prompts
   * @param promptPostfix Postfix for user prompts
   */
  async setChatTemplate(systemPrompt: string, promptPrefix: string, promptPostfix: string): Promise<void> {
    this.checkInitialized();
    return await this.backend!.setChatTemplate(systemPrompt, promptPrefix, promptPostfix);
  }

  /**
   * Load prompt cache from file
   * @param cachePath Path to the cache file
   */
  async loadPromptCache(cachePath: string): Promise<void> {
    this.checkInitialized();
    return await this.backend!.loadPromptCache(cachePath);
  }

  /**
   * Release prompt cache from memory
   */
  async releasePromptCache(): Promise<void> {
    this.checkInitialized();
    return await this.backend!.releasePromptCache();
  }

  /**
   * Abort current inference operation
   */
  async abort(): Promise<void> {
    this.checkInitialized();
    return await this.backend!.abort();
  }

  /**
   * Check if inference is currently running
   */
  async isRunning(): Promise<boolean> {
    this.checkInitialized();
    return await this.backend!.isRunning();
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
