import { RKLLMParam, RKLLMInput, RKLLMResult, StreamOptions, RKLLMLoraAdapter } from './types.js';
import { requireValidModelPath } from './utils/model-validator.js';

// Backend implementations
type BackendType = 'napi' | 'ffi';

interface RKLLMBackend {
  init(params: RKLLMParam): Promise<void>;
  run(input: RKLLMInput): Promise<RKLLMResult>;
  runStream(input: RKLLMInput, options: StreamOptions): Promise<void>;
  loadLoRA?(adapter: RKLLMLoraAdapter): Promise<void>;
  unloadLoRA?(): Promise<void>;
  getContextLength?(): number;
  clearContext?(): Promise<void>;
  destroy(): Promise<void>;
  get initialized(): boolean;
}

/**
 * Detect the best available backend
 */
function detectBackend(): BackendType {
  // Check if we're running in Bun and FFI is available
  if (typeof Bun !== 'undefined' && typeof Bun.version === 'string') {
    return 'ffi';
  }
  
  // Default to N-API for Node.js and other environments
  return 'napi';
}

/**
 * Main RKLLM class for interacting with Rockchip LLM Runtime
 */
export class RKLLM {
  private backend: RKLLMBackend | null = null;
  private currentBackendType: BackendType | null = null;

  /**
   * Initialize the LLM with the given parameters
   * @param params Configuration parameters for the LLM
   * @param preferredBackend Optional backend preference ('napi' | 'ffi')
   */
  async init(params: RKLLMParam, preferredBackend?: BackendType): Promise<void> {
    if (this.backend?.initialized) {
      throw new Error('RKLLM is already initialized');
    }

    // Validate model path before attempting to initialize
    await requireValidModelPath(params.modelPath);
    
    // Determine which backend to use
    this.currentBackendType = preferredBackend || detectBackend();
    
    try {
      this.backend = await this.createBackend(this.currentBackendType);
      await this.backend.init(params);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // If FFI fails and we auto-detected it, try falling back to N-API
      if (this.currentBackendType === 'ffi' && !preferredBackend) {
        console.warn('FFI backend failed, falling back to N-API:', errorMessage);
        try {
          this.currentBackendType = 'napi';
          this.backend = await this.createBackend(this.currentBackendType);
          await this.backend.init(params);
          return;
        } catch (napiError) {
          const napiErrorMessage = napiError instanceof Error ? napiError.message : String(napiError);
          throw new Error(`Both backends failed. FFI: ${errorMessage}, N-API: ${napiErrorMessage}`);
        }
      }
      
      throw new Error(`Failed to initialize RKLLM with ${this.currentBackendType} backend: ${errorMessage}`);
    }
  }

  /**
   * Create backend implementation
   */
  private async createBackend(type: BackendType): Promise<RKLLMBackend> {
    switch (type) {
      case 'ffi': {
        const { RKLLMFFIImpl } = await import('./ffi/rkllm-ffi-impl.js');
        return new RKLLMFFIImpl();
      }
      case 'napi': {
        const { RKLLMNAPIImpl } = await import('./napi/rkllm-napi-impl.js');
        return new RKLLMNAPIImpl();
      }
      default:
        throw new Error(`Unknown backend type: ${type}`);
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
    
    if (this.backend!.loadLoRA) {
      return await this.backend!.loadLoRA(adapter);
    } else {
      throw new Error(`LoRA adapter loading not supported with ${this.currentBackendType} backend`);
    }
  }

  /**
   * Unload the current LoRA adapter
   */
  async unloadLoraAdapter(): Promise<void> {
    this.checkInitialized();
    
    if (this.backend!.unloadLoRA) {
      return await this.backend!.unloadLoRA();
    } else {
      throw new Error(`LoRA adapter unloading not supported with ${this.currentBackendType} backend`);
    }
  }

  /**
   * Get the current context length
   */
  getContextLength(): number {
    this.checkInitialized();
    
    if (this.backend!.getContextLength) {
      return this.backend!.getContextLength();
    } else {
      throw new Error(`Context length retrieval not supported with ${this.currentBackendType} backend`);
    }
  }

  /**
   * Clear the current context
   */
  async clearContext(): Promise<void> {
    this.checkInitialized();
    
    if (this.backend!.clearContext) {
      return await this.backend!.clearContext();
    } else {
      throw new Error(`Context clearing not supported with ${this.currentBackendType} backend`);
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
    this.currentBackendType = null;
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
  get backendType(): BackendType | null {
    return this.currentBackendType;
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
