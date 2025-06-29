/**
 * @file llm-handle-wrapper.ts
 * @brief TypeScript wrapper for LLM Handle N-API bindings
 * 
 * Provides type-safe TypeScript interface for core LLM handle management:
 * - Creating default parameters
 * - Initializing LLM instances  
 * - Destroying LLM instances
 */

// Enums matching RKLLM C definitions
export enum LLMCallState {
  RKLLM_RUN_NORMAL = 0,
  RKLLM_RUN_WAITING = 1,
  RKLLM_RUN_FINISH = 2,
  RKLLM_RUN_ERROR = 3
}

export enum RKLLMInputType {
  RKLLM_INPUT_PROMPT = 0,
  RKLLM_INPUT_TOKEN = 1,
  RKLLM_INPUT_EMBED = 2,
  RKLLM_INPUT_MULTIMODAL = 3
}

export enum RKLLMInferMode {
  RKLLM_INFER_GENERATE = 0,
  RKLLM_INFER_GET_LAST_HIDDEN_LAYER = 1,
  RKLLM_INFER_GET_LOGITS = 2
}

// CPU core constants
export const CPU_MASKS = {
  CPU0: 1 << 0,
  CPU1: 1 << 1,
  CPU2: 1 << 2,
  CPU3: 1 << 3,
  CPU4: 1 << 4,
  CPU5: 1 << 5,
  CPU6: 1 << 6,
  CPU7: 1 << 7
} as const;

// Complete RKLLMExtendParam structure
export interface RKLLMExtendParam {
  base_domain_id: number;
  embed_flash: number;
  enabled_cpus_num: number;
  enabled_cpus_mask: number;
  n_batch: number;
  use_cross_attn: number;
  reserved: Uint8Array;  // 104 bytes reserved
}

// Complete RKLLMParam structure with all fields
export interface RKLLMParam {
  model_path: string;
  max_context_len: number;
  max_new_tokens: number;
  top_k: number;
  n_keep: number;
  top_p: number;
  temperature: number;
  repeat_penalty: number;
  frequency_penalty: number;
  presence_penalty: number;
  mirostat: number;
  mirostat_tau: number;
  mirostat_eta: number;
  skip_special_token: boolean;
  is_async: boolean;
  img_start?: string;
  img_end?: string;
  img_content?: string;
  extend_param: RKLLMExtendParam;
}

// LoRA adapter configuration
export interface RKLLMLoraAdapter {
  lora_adapter_path: string;
  lora_adapter_name: string;
  scale: number;
}

// Embedding input structure
export interface RKLLMEmbedInput {
  embed: Float32Array;
  n_tokens: number;
}

// Token input structure
export interface RKLLMTokenInput {
  input_ids: Int32Array;
  n_tokens: number;
}

// Multimodal input structure
export interface RKLLMMultiModelInput {
  prompt: string;
  image_embed: Float32Array;
  n_image_tokens: number;
  n_image: number;
  image_width: number;
  image_height: number;
}

// Generic input structure with union type
export interface RKLLMInput {
  role?: string;
  enable_thinking?: boolean;
  input_type: RKLLMInputType;
  prompt_input?: string;
  embed_input?: RKLLMEmbedInput;
  token_input?: RKLLMTokenInput;
  multimodal_input?: RKLLMMultiModelInput;
}

// LoRA parameters for inference
export interface RKLLMLoraParam {
  lora_adapter_name: string;
}

// Prompt cache parameters
export interface RKLLMPromptCacheParam {
  save_prompt_cache: number;
  prompt_cache_path: string;
}

// Cross-attention parameters
export interface RKLLMCrossAttnParam {
  encoder_k_cache: Float32Array;
  encoder_v_cache: Float32Array;
  encoder_mask: Float32Array;
  encoder_pos: Int32Array;
  num_tokens: number;
}

// Inference parameters
export interface RKLLMInferParam {
  mode: RKLLMInferMode;
  lora_params?: RKLLMLoraParam[];
  prompt_cache_params?: RKLLMPromptCacheParam;
  keep_history: number;
}

// Result structures
export interface RKLLMResultLastHiddenLayer {
  hidden_states: Float32Array;
  embd_size: number;
  num_tokens: number;
}

export interface RKLLMResultLogits {
  logits: Float32Array;
  vocab_size: number;
  num_tokens: number;
}

export interface RKLLMPerfStat {
  prefill_time_ms: number;
  prefill_tokens: number;
  generate_time_ms: number;
  generate_tokens: number;
  memory_usage_mb: number;
}

export interface RKLLMResult {
  text: string;
  token_id: number;
  last_hidden_layer: RKLLMResultLastHiddenLayer;
  logits: RKLLMResultLogits;
  perf: RKLLMPerfStat;
}

// Type definition for LLM handle
export interface LLMHandle {
  _handle: any; // Internal native handle - do not access directly
}

// Result callback type with proper typing
export type LLMResultCallback = (result: RKLLMResult, userdata: any, state: LLMCallState) => number;

/**
 * @class LLMHandleWrapper
 * @brief TypeScript wrapper for LLM handle operations
 * 
 * This class provides a type-safe interface to the native RKLLM library
 * through N-API bindings. It handles LLM initialization, configuration,
 * inference operations, and cleanup.
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

  // === Core LLM Management Functions ===

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

  // === LoRA Functions ===

  /**
   * @brief Load a LoRA adapter into the LLM
   * @param handle LLM handle
   * @param lora_adapter LoRA adapter configuration
   * @returns Promise<number> Status code (0 for success)
   * @throws Error if loading fails
   */
  public static async loadLora(handle: LLMHandle, lora_adapter: RKLLMLoraAdapter): Promise<number> {
    this.loadNativeBinding();

    if (!handle || !handle._handle) {
      throw new Error('Invalid LLM handle');
    }

    try {
      const result = this.nativeBinding.loadLora(handle, lora_adapter);
      return result as number;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load LoRA adapter: ${errorMessage}`);
    }
  }

  // === Prompt Cache Functions ===

  /**
   * @brief Load a prompt cache from file
   * @param handle LLM handle
   * @param prompt_cache_path Path to the prompt cache file
   * @returns Promise<number> Status code (0 for success)
   * @throws Error if loading fails
   */
  public static async loadPromptCache(handle: LLMHandle, prompt_cache_path: string): Promise<number> {
    this.loadNativeBinding();

    if (!handle || !handle._handle) {
      throw new Error('Invalid LLM handle');
    }

    try {
      const result = this.nativeBinding.loadPromptCache(handle, prompt_cache_path);
      return result as number;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load prompt cache: ${errorMessage}`);
    }
  }

  /**
   * @brief Release the prompt cache from memory
   * @param handle LLM handle
   * @returns Promise<number> Status code (0 for success)
   * @throws Error if release fails
   */
  public static async releasePromptCache(handle: LLMHandle): Promise<number> {
    this.loadNativeBinding();

    if (!handle || !handle._handle) {
      throw new Error('Invalid LLM handle');
    }

    try {
      const result = this.nativeBinding.releasePromptCache(handle);
      return result as number;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to release prompt cache: ${errorMessage}`);
    }
  }

  // === Inference Functions ===

  /**
   * @brief Run LLM inference synchronously
   * @param handle LLM handle
   * @param input Input data for the LLM
   * @param infer_params Parameters for the inference task
   * @param userdata User data for the callback
   * @returns Promise<number> Status code (0 for success)
   * @throws Error if inference fails
   */
  public static async run(
    handle: LLMHandle, 
    input: RKLLMInput, 
    infer_params: RKLLMInferParam, 
    userdata?: any
  ): Promise<number> {
    this.loadNativeBinding();

    if (!handle || !handle._handle) {
      throw new Error('Invalid LLM handle');
    }

    try {
      const result = this.nativeBinding.run(handle, input, infer_params, userdata);
      return result as number;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to run inference: ${errorMessage}`);
    }
  }

  /**
   * @brief Run LLM inference asynchronously
   * @param handle LLM handle
   * @param input Input data for the LLM
   * @param infer_params Parameters for the inference task
   * @param userdata User data for the callback
   * @returns Promise<number> Status code (0 for success)
   * @throws Error if inference fails
   */
  public static async runAsync(
    handle: LLMHandle, 
    input: RKLLMInput, 
    infer_params: RKLLMInferParam, 
    userdata?: any
  ): Promise<number> {
    this.loadNativeBinding();

    if (!handle || !handle._handle) {
      throw new Error('Invalid LLM handle');
    }

    try {
      const result = this.nativeBinding.runAsync(handle, input, infer_params, userdata);
      return result as number;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to run async inference: ${errorMessage}`);
    }
  }

  /**
   * @brief Abort an ongoing LLM task
   * @param handle LLM handle
   * @returns Promise<number> Status code (0 for success)
   * @throws Error if abort fails
   */
  public static async abort(handle: LLMHandle): Promise<number> {
    this.loadNativeBinding();

    if (!handle || !handle._handle) {
      throw new Error('Invalid LLM handle');
    }

    try {
      const result = this.nativeBinding.abort(handle);
      return result as number;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to abort LLM task: ${errorMessage}`);
    }
  }

  /**
   * @brief Check if an LLM task is currently running
   * @param handle LLM handle
   * @returns Promise<boolean> True if running, false otherwise
   * @throws Error if check fails
   */
  public static async isRunning(handle: LLMHandle): Promise<boolean> {
    this.loadNativeBinding();

    if (!handle || !handle._handle) {
      throw new Error('Invalid LLM handle');
    }

    try {
      const result = this.nativeBinding.isRunning(handle);
      return result === 0; // rkllm_is_running returns 0 if running
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to check running status: ${errorMessage}`);
    }
  }

  // === Key-Value Cache Functions ===

  /**
   * @brief Clear the key-value cache
   * @param handle LLM handle
   * @param keep_system_prompt Whether to retain system prompt
   * @param start_pos Array of start positions to clear
   * @param end_pos Array of end positions to clear
   * @returns Promise<number> Status code (0 for success)
   * @throws Error if clear fails
   */
  public static async clearKVCache(
    handle: LLMHandle, 
    keep_system_prompt: boolean, 
    start_pos?: Int32Array, 
    end_pos?: Int32Array
  ): Promise<number> {
    this.loadNativeBinding();

    if (!handle || !handle._handle) {
      throw new Error('Invalid LLM handle');
    }

    try {
      const result = this.nativeBinding.clearKVCache(handle, keep_system_prompt ? 1 : 0, start_pos, end_pos);
      return result as number;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to clear KV cache: ${errorMessage}`);
    }
  }

  /**
   * @brief Get the current size of the key-value cache
   * @param handle LLM handle
   * @returns Promise<Int32Array> Cache sizes per batch
   * @throws Error if get fails
   */
  public static async getKVCacheSize(handle: LLMHandle): Promise<Int32Array> {
    this.loadNativeBinding();

    if (!handle || !handle._handle) {
      throw new Error('Invalid LLM handle');
    }

    try {
      const result = this.nativeBinding.getKVCacheSize(handle);
      return result as Int32Array;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get KV cache size: ${errorMessage}`);
    }
  }

  // === Configuration Functions ===

  /**
   * @brief Set the chat template for the LLM
   * @param handle LLM handle
   * @param system_prompt System prompt for the model
   * @param prompt_prefix Prefix added before user input
   * @param prompt_postfix Postfix added after user input
   * @returns Promise<number> Status code (0 for success)
   * @throws Error if setting fails
   */
  public static async setChatTemplate(
    handle: LLMHandle, 
    system_prompt: string, 
    prompt_prefix: string, 
    prompt_postfix: string
  ): Promise<number> {
    this.loadNativeBinding();

    if (!handle || !handle._handle) {
      throw new Error('Invalid LLM handle');
    }

    try {
      const result = this.nativeBinding.setChatTemplate(handle, system_prompt, prompt_prefix, prompt_postfix);
      return result as number;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to set chat template: ${errorMessage}`);
    }
  }

  /**
   * @brief Set function calling configuration for the LLM
   * @param handle LLM handle
   * @param system_prompt System prompt for function calling
   * @param tools JSON string defining available functions
   * @param tool_response_str Marker for tool responses
   * @returns Promise<number> Status code (0 for success)
   * @throws Error if setting fails
   */
  public static async setFunctionTools(
    handle: LLMHandle, 
    system_prompt: string, 
    tools: string, 
    tool_response_str: string
  ): Promise<number> {
    this.loadNativeBinding();

    if (!handle || !handle._handle) {
      throw new Error('Invalid LLM handle');
    }

    try {
      const result = this.nativeBinding.setFunctionTools(handle, system_prompt, tools, tool_response_str);
      return result as number;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to set function tools: ${errorMessage}`);
    }
  }

  /**
   * @brief Set cross-attention parameters for the LLM decoder
   * @param handle LLM handle
   * @param cross_attn_params Cross-attention parameters
   * @returns Promise<number> Status code (0 for success)
   * @throws Error if setting fails
   */
  public static async setCrossAttnParams(
    handle: LLMHandle, 
    cross_attn_params: RKLLMCrossAttnParam
  ): Promise<number> {
    this.loadNativeBinding();

    if (!handle || !handle._handle) {
      throw new Error('Invalid LLM handle');
    }

    try {
      const result = this.nativeBinding.setCrossAttnParams(handle, cross_attn_params);
      return result as number;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to set cross-attention parameters: ${errorMessage}`);
    }
  }

  // === Synchronous Compatibility Functions ===

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