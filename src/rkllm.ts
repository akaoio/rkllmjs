import { RKLLMParam, RKLLMInput, RKLLMResult, StreamOptions, RKLLMLoraAdapter } from './types.js';
import { requireValidModelPath } from './utils/model-validator.js';

/**
 * Main RKLLM class for interacting with Rockchip LLM Runtime
 */
export class RKLLM {
  private handle: any = null;
  private isInitialized = false;
  private addon: any = null;

  /**
   * Initialize the LLM with the given parameters
   * @param params Configuration parameters for the LLM
   */
  async init(params: RKLLMParam): Promise<void> {
    if (this.isInitialized) {
      throw new Error('RKLLM is already initialized');
    }

    // Validate model path before attempting to initialize
    await requireValidModelPath(params.modelPath);        try {
            // Load the native addon using standard require
            // @ts-ignore - Native module loading
            const { createRequire } = await import('module');
            const require = createRequire(import.meta.url);
            this.addon = require('../build/Release/rkllmjs.node');
            
            if (!this.addon) {
                throw new Error('Failed to load native addon');
            }
            
            this.handle = await this.addon.rkllmInit(params);
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
      return await this.addon.rkllmRun(this.handle, input);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Inference failed: ${errorMessage}`);
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
      return await this.addon.rkllmRunStream(this.handle, input, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Streaming inference failed: ${errorMessage}`);
    }
  }

  /**
   * Load a LoRA adapter
   * @param adapter LoRA adapter configuration
   */
  async loadLoraAdapter(adapter: RKLLMLoraAdapter): Promise<void> {
    this.checkInitialized();
    
    try {
      return await this.addon.rkllmLoadLora(this.handle, adapter);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load LoRA adapter: ${errorMessage}`);
    }
  }

  /**
   * Unload the current LoRA adapter
   */
  async unloadLoraAdapter(): Promise<void> {
    this.checkInitialized();
    
    try {
      return await this.addon.rkllmUnloadLora(this.handle);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to unload LoRA adapter: ${errorMessage}`);
    }
  }

  /**
   * Get the current context length
   */
  getContextLength(): number {
    this.checkInitialized();
    
    try {
      return this.addon.rkllmGetContextLength(this.handle);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get context length: ${errorMessage}`);
    }
  }

  /**
   * Clear the current context
   */
  async clearContext(): Promise<void> {
    this.checkInitialized();
    
    try {
      return await this.addon.rkllmClearContext(this.handle);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to clear context: ${errorMessage}`);
    }
  }

  /**
   * Destroy the LLM instance and free resources
   */
  async destroy(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await this.addon.rkllmDestroy(this.handle);
      this.handle = null;
      this.addon = null;
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
    if (!this.isInitialized || !this.addon) {
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
