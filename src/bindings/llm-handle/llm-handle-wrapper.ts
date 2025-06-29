/**
 * @file llm-handle-wrapper.ts
 * @brief TypeScript wrapper for LLM Handle N-API bindings
 * 
 * Provides type-safe TypeScript interface for core LLM handle management:
 * - Creating default parameters
 * - Initializing LLM instances  
 * - Destroying LLM instances
 */

// Type definitions for RKLLM parameters
export interface RKLLMParam {
  model_path: string;
  max_context_len?: number;
  max_new_tokens?: number;
  top_k?: number;
  top_p?: number;
  temperature?: number;
  repeat_penalty?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  mirostat?: number;
  mirostat_tau?: number;
  mirostat_eta?: number;
  skip_special_token?: boolean;
  is_async?: boolean;
  img_start?: string;
  img_end?: string;
  img_content?: string;
}

// Type definition for LLM handle
export interface LLMHandle {
  _handle: any; // Internal native handle - do not access directly
}

// Result callback type
export type LLMResultCallback = (result: any, userdata: any, state: number) => number;

/**
 * @class LLMHandleWrapper
 * @brief TypeScript wrapper for LLM handle operations
 * 
 * This class provides a type-safe interface to the native RKLLM library
 * through N-API bindings. It handles LLM initialization, configuration,
 * and cleanup operations.
 */
export class LLMHandleWrapper {
  private static nativeBinding: any = null;

  /**
   * @brief Initialize the native binding
   * @throws Error if native binding cannot be loaded
   */
  private static loadNativeBinding(): void {
    if (this.nativeBinding === null) {
      try {
        // This will be the compiled .node file
        this.nativeBinding = require('../../../build/Release/binding.node');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to load native binding: ${errorMessage}`);
      }
    }
  }

  /**
   * @brief Create default RKLLM parameters
   * @returns Promise<RKLLMParam> Default parameters object
   * @throws Error if native function fails
   */
  public static async createDefaultParam(): Promise<RKLLMParam> {
    this.loadNativeBinding();
    
    try {
      const result = this.nativeBinding.createDefaultParam();
      return result as RKLLMParam;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create default parameters: ${errorMessage}`);
    }
  }

  /**
   * @brief Initialize LLM with given parameters
   * @param param Configuration parameters for the LLM
   * @param callback Optional result callback function
   * @returns Promise<LLMHandle> Initialized LLM handle
   * @throws Error if initialization fails
   */
  public static async init(
    param: RKLLMParam, 
    callback?: LLMResultCallback
  ): Promise<LLMHandle> {
    this.loadNativeBinding();

    // Validate required parameters
    if (!param.model_path) {
      throw new Error('model_path is required');
    }

    try {
      const result = this.nativeBinding.init(param, callback);
      return result as LLMHandle;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize LLM: ${errorMessage}`);
    }
  }

  /**
   * @brief Destroy LLM instance and release resources
   * @param handle LLM handle to destroy
   * @returns Promise<boolean> True if destruction was successful
   * @throws Error if destruction fails
   */
  public static async destroy(handle: LLMHandle): Promise<boolean> {
    this.loadNativeBinding();

    if (!handle || !handle._handle) {
      throw new Error('Invalid LLM handle');
    }

    try {
      const result = this.nativeBinding.destroy(handle);
      return result as boolean;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to destroy LLM: ${errorMessage}`);
    }
  }

  /**
   * @brief Create default parameters synchronously (for compatibility)
   * @returns RKLLMParam Default parameters object
   * @throws Error if native function fails
   */
  public static createDefaultParamSync(): RKLLMParam {
    this.loadNativeBinding();
    
    try {
      const result = this.nativeBinding.createDefaultParam();
      return result as RKLLMParam;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create default parameters: ${errorMessage}`);
    }
  }

  /**
   * @brief Initialize LLM synchronously (for compatibility)
   * @param param Configuration parameters for the LLM
   * @param callback Optional result callback function
   * @returns LLMHandle Initialized LLM handle
   * @throws Error if initialization fails
   */
  public static initSync(
    param: RKLLMParam, 
    callback?: LLMResultCallback
  ): LLMHandle {
    this.loadNativeBinding();

    // Validate required parameters
    if (!param.model_path) {
      throw new Error('model_path is required');
    }

    try {
      const result = this.nativeBinding.init(param, callback);
      return result as LLMHandle;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize LLM: ${errorMessage}`);
    }
  }

  /**
   * @brief Destroy LLM instance synchronously (for compatibility)
   * @param handle LLM handle to destroy
   * @returns boolean True if destruction was successful
   * @throws Error if destruction fails
   */
  public static destroySync(handle: LLMHandle): boolean {
    this.loadNativeBinding();

    if (!handle || !handle._handle) {
      throw new Error('Invalid LLM handle');
    }

    try {
      const result = this.nativeBinding.destroy(handle);
      return result as boolean;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to destroy LLM: ${errorMessage}`);
    }
  }
}

// Export types and main class
export default LLMHandleWrapper;