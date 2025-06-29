/**
 * RKLLM Client - High-level TypeScript wrapper for RKLLM C++ bindings
 * Provides a Promise-based API for easy integration with JavaScript/TypeScript applications
 */

import { EventEmitter } from 'events';
import {
  // Types and interfaces
  type RKLLMParam,
  type RKLLMInput,
  type RKLLMResult,
  type RKLLMInferParam,
  type RKLLMLoraAdapter,
  type LLMResultCallback,
  type DefaultParamOptions,
  type ChatTemplateConfig,
  type FunctionToolsConfig,
  
  // Enums
  LLMCallState,
  RKLLMInputType,
  RKLLMInferMode,
  RKLLMStatusCode,
  
  // Error handling
  RKLLMError,
} from '../rkllm-types/rkllm-types.js';

// ============================================================================
// Client Configuration and Options
// ============================================================================

/**
 * Configuration options for RKLLM Client initialization
 */
export interface RKLLMClientConfig extends Partial<RKLLMParam> {
  modelPath: string;                    // Required: path to model file
  autoInit?: boolean;                   // Auto-initialize on creation (default: true)
  enableEventLogging?: boolean;         // Enable detailed event logging (default: false)
  callbackTimeout?: number;             // Callback timeout in ms (default: 30000)
  maxRetries?: number;                  // Max retry attempts for failed operations (default: 3)
  retryDelay?: number;                  // Delay between retries in ms (default: 1000)
}

/**
 * Options for inference operations
 */
export interface InferenceOptions {
  mode?: RKLLMInferMode;                // Inference mode (default: GENERATE)
  streaming?: boolean;                  // Enable streaming responses (default: false)
  onToken?: (token: string) => void;    // Token-by-token callback for streaming
  onProgress?: (progress: number) => void; // Progress callback (0-1)
  signal?: AbortSignal;                 // Abort signal for cancellation
  timeout?: number;                     // Operation timeout in ms
}

/**
 * Result from inference operations
 */
export interface InferenceResult {
  text: string;                         // Generated text
  tokenCount: number;                   // Number of tokens generated
  finishReason: 'completed' | 'stopped' | 'error' | 'timeout'; // Completion reason
  performance: {
    prefillTimeMs: number;              // Time for prefill stage
    generateTimeMs: number;             // Time for generation stage
    totalTimeMs: number;                // Total inference time
    tokensPerSecond: number;            // Generation speed
    memoryUsageMb: number;              // Memory usage
  };
  metadata?: {
    modelName?: string;                 // Model identifier
    contextLength?: number;             // Context window used
    stopSequence?: string;              // Stop sequence that triggered completion
  };
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Events emitted by RKLLMClient
 */
export interface RKLLMClientEvents {
  'initialized': () => void;
  'destroyed': () => void;
  'inference:start': (input: RKLLMInput) => void;
  'inference:token': (token: string, tokenId: number) => void;
  'inference:progress': (progress: number) => void;
  'inference:complete': (result: InferenceResult) => void;
  'inference:error': (error: RKLLMError) => void;
  'inference:abort': () => void;
  'model:loaded': (modelPath: string) => void;
  'model:unloaded': () => void;
  'lora:loaded': (adapterName: string) => void;
  'lora:unloaded': (adapterName: string) => void;
  'cache:saved': (cachePath: string) => void;
  'cache:loaded': (cachePath: string) => void;
  'cache:cleared': () => void;
  'error': (error: RKLLMError) => void;
  'warning': (message: string) => void;
  'debug': (message: string, data?: any) => void;
}

// ============================================================================
// Main Client Class
// ============================================================================

/**
 * High-level TypeScript wrapper for RKLLM C++ library
 * 
 * Provides Promise-based API with event support. Integrates seamlessly with 
 * native C++ N-API bindings (PR #34) when available, falls back to mock 
 * implementation for development without RK3588 hardware.
 * 
 * Architecture:
 * ┌─────────────────────────────┐
 * │   RKLLMClient (this)        │ ← High-level Promise-based API
 * ├─────────────────────────────┤  
 * │   LLMHandleWrapper (PR #34) │ ← Native binding TypeScript wrapper
 * ├─────────────────────────────┤
 * │   C++ N-API Bindings       │ ← Native bridge layer (PR #34)
 * ├─────────────────────────────┤
 * │   RKLLM C API              │ ← Rockchip library
 * └─────────────────────────────┘
 */
export class RKLLMClient extends EventEmitter {
  private config: RKLLMClientConfig;
  private isInitialized: boolean = false;
  private isRunning: boolean = false;
  private currentAbortController: AbortController | null = null;
  private modelPath: string;
  private nativeHandle: any = null; // Handle from PR #34's native bindings
  private loadedLoraAdapters: Set<string> = new Set();

  // ============================================================================
  // Constructor and Initialization
  // ============================================================================

  constructor(config: RKLLMClientConfig) {
    super();
    
    this.config = {
      // Default configuration
      maxContextLen: 4096,
      maxNewTokens: 512,
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      nKeep: 0,
      repeatPenalty: 1.1,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      mirostat: 0,
      mirostatTau: 5.0,
      mirostatEta: 0.1,
      skipSpecialToken: false,
      isAsync: true,
      autoInit: true,
      enableEventLogging: false,
      callbackTimeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      extendParam: {
        baseDomainId: 0,
        embedFlash: false,
        enabledCpusNum: 4,
        enabledCpusMask: 0x0F,
        nBatch: 1,
        useCrossAttn: false,
      },
      // Override with user config
      ...config,
    };

    this.modelPath = this.config.modelPath;

    // Auto-initialize if enabled
    if (this.config.autoInit) {
      this.initialize().catch(error => {
        this.emit('error', new RKLLMError('Auto-initialization failed', RKLLMStatusCode.ERROR_MODEL_LOAD_FAILED, error.message));
      });
    }
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  /**
   * Initialize the RKLLM instance
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new RKLLMError('Client already initialized', RKLLMStatusCode.ERROR_UNKNOWN);
    }

    try {
      this.debugLog('Initializing RKLLM client', { modelPath: this.modelPath });

      // Call native rkllm_init when available (PR #34 integration)
      const result = await this.callNativeFunction('rkllm_init', this.config);
      
      // Store native handle if returned
      if (result.handle) {
        this.nativeHandle = result.handleId;
        this.debugLog('Native handle obtained', { handle: this.nativeHandle });
      }

      this.isInitialized = true;
      
      this.emit('initialized');
      this.emit('model:loaded', this.modelPath);
      this.debugLog('RKLLM client initialized successfully');

    } catch (error) {
      const rkllmError = error instanceof RKLLMError ? error : 
        new RKLLMError('Initialization failed', RKLLMStatusCode.ERROR_MODEL_LOAD_FAILED, error instanceof Error ? error.message : String(error));
      
      this.emit('error', rkllmError);
      throw rkllmError;
    }
  }

  /**
   * Destroy the RKLLM instance and cleanup resources
   */
  async destroy(): Promise<void> {
    if (!this.isInitialized) {
      return; // Already destroyed or never initialized
    }

    try {
      this.debugLog('Destroying RKLLM client');

      // Abort any running inference
      if (this.isRunning) {
        await this.abort();
      }

      // Clear any loaded LoRA adapters
      this.loadedLoraAdapters.clear();

      // Call native rkllm_destroy when available (PR #34 integration)
      if (this.nativeHandle) {
        await this.callNativeFunction('rkllm_destroy', { handleId: this.nativeHandle });
        this.nativeHandle = null;
      } else {
        await this.callNativeFunction('rkllm_destroy');
      }

      this.isInitialized = false;
      
      this.emit('destroyed');
      this.emit('model:unloaded');
      this.debugLog('RKLLM client destroyed successfully');

    } catch (error) {
      const rkllmError = error instanceof RKLLMError ? error : 
        new RKLLMError('Destruction failed', RKLLMStatusCode.ERROR_UNKNOWN, error instanceof Error ? error.message : String(error));
      
      this.emit('error', rkllmError);
      throw rkllmError;
    }
  }

  // ============================================================================
  // Core Inference Methods
  // ============================================================================

  /**
   * Generate text from prompt
   */
  async generate(prompt: string, options: InferenceOptions = {}): Promise<InferenceResult> {
    const input: RKLLMInput = {
      role: 'user',
      inputType: RKLLMInputType.PROMPT,
      promptInput: prompt,
    };

    return this.infer(input, options);
  }

  /**
   * Generate text from token sequence
   */
  async generateFromTokens(tokens: Int32Array, options: InferenceOptions = {}): Promise<InferenceResult> {
    const input: RKLLMInput = {
      inputType: RKLLMInputType.TOKEN,
      tokenInput: {
        inputIds: tokens,
        nTokens: tokens.length,
      },
    };

    return this.infer(input, options);
  }

  /**
   * Generate text from embedding
   */
  async generateFromEmbedding(embedding: Float32Array, nTokens: number, options: InferenceOptions = {}): Promise<InferenceResult> {
    const input: RKLLMInput = {
      inputType: RKLLMInputType.EMBED,
      embedInput: {
        embed: embedding,
        nTokens: nTokens,
      },
    };

    return this.infer(input, options);
  }

  /**
   * Core inference method
   */
  async infer(input: RKLLMInput, options: InferenceOptions = {}): Promise<InferenceResult> {
    this.ensureInitialized();
    
    if (this.isRunning) {
      throw new RKLLMError('Inference already running', RKLLMStatusCode.ERROR_TASK_RUNNING);
    }

    const startTime = Date.now();
    this.isRunning = true;
    this.currentAbortController = new AbortController();

    try {
      this.emit('inference:start', input);
      this.debugLog('Starting inference', { input, options });

      // Prepare inference parameters
      const inferParams: RKLLMInferParam = {
        mode: options.mode ?? RKLLMInferMode.GENERATE,
        keepHistory: true, // TODO: Make this configurable
      };

      // Set up result accumulation
      let generatedText = '';
      let tokenCount = 0;
      let prefillTime = 0;
      let generateTime = 0;
      let memoryUsage = 0;

      // Set up callback for handling results
      const callback: LLMResultCallback = async (result: RKLLMResult, state: LLMCallState) => {
        if (this.currentAbortController?.signal.aborted) {
          return 1; // Pause inference if aborted
        }

        if (result.text) {
          generatedText += result.text;
          tokenCount++;
          
          // Emit token event
          this.emit('inference:token', result.text, result.tokenId ?? 0);
          
          // Call user token callback if provided
          if (options.onToken) {
            options.onToken(result.text);
          }
          
          // Emit progress if callback provided
          if (options.onProgress && this.config.maxNewTokens) {
            const progress = Math.min(tokenCount / this.config.maxNewTokens!, 1);
            this.emit('inference:progress', progress);
            options.onProgress(progress);
          }
        }

        // Update performance stats
        if (result.perf) {
          prefillTime = result.perf.prefillTimeMs;
          generateTime = result.perf.generateTimeMs;
          memoryUsage = result.perf.memoryUsageMb;
        }

        // Return based on state
        switch (state) {
          case LLMCallState.FINISH:
            return 0; // Continue (will complete)
          case LLMCallState.ERROR:
            return 1; // Pause on error
          default:
            return 0; // Continue normal processing
        }
      };

      // TODO: Call native inference when C++ bindings are available
      const result = await this.runInference(input, inferParams, callback, options);
      
      const totalTime = Date.now() - startTime;
      const tokensPerSecond = tokenCount > 0 ? (tokenCount / (generateTime / 1000)) : 0;

      const inferenceResult: InferenceResult = {
        text: generatedText || result.text || '',
        tokenCount: tokenCount || 1,
        finishReason: 'completed',
        performance: {
          prefillTimeMs: prefillTime,
          generateTimeMs: generateTime,
          totalTimeMs: totalTime,
          tokensPerSecond: tokensPerSecond,
          memoryUsageMb: memoryUsage,
        },
        metadata: this.config.maxContextLen ? {
          modelName: this.modelPath,
          contextLength: this.config.maxContextLen,
        } : {
          modelName: this.modelPath,
        },
      };

      this.emit('inference:complete', inferenceResult);
      this.debugLog('Inference completed', { result: inferenceResult });
      
      return inferenceResult;

    } catch (error) {
      const rkllmError = error instanceof RKLLMError ? error : 
        new RKLLMError('Inference failed', RKLLMStatusCode.ERROR_INFERENCE_FAILED, error instanceof Error ? error.message : String(error));
      
      this.emit('inference:error', rkllmError);
      throw rkllmError;

    } finally {
      this.isRunning = false;
      this.currentAbortController = null;
    }
  }

  // ============================================================================
  // Control Methods
  // ============================================================================

  /**
   * Abort current inference
   */
  async abort(): Promise<void> {
    if (!this.isRunning) {
      return; // Nothing to abort
    }

    try {
      this.debugLog('Aborting inference');
      
      // Signal abort to current operation
      if (this.currentAbortController) {
        this.currentAbortController.abort();
      }

      // TODO: Call native rkllm_abort when C++ bindings are available
      await this.callNativeFunction('rkllm_abort', { handleId: this.nativeHandle });

      this.emit('inference:abort');
      this.debugLog('Inference aborted successfully');

    } catch (error) {
      const rkllmError = error instanceof RKLLMError ? error : 
        new RKLLMError('Abort failed', RKLLMStatusCode.ERROR_UNKNOWN, error instanceof Error ? error.message : String(error));
      
      this.emit('error', rkllmError);
      throw rkllmError;
    }
  }

  /**
   * Check if inference is currently running
   */
  isInferenceRunning(): boolean {
    return this.isRunning;
  }

  // ============================================================================
  // Configuration Methods
  // ============================================================================

  /**
   * Load LoRA adapter
   */
  async loadLora(adapter: RKLLMLoraAdapter): Promise<void> {
    this.ensureInitialized();

    try {
      this.debugLog('Loading LoRA adapter', { adapter });

      // TODO: Call native rkllm_load_lora when C++ bindings are available
      await this.callNativeFunction('rkllm_load_lora', this.nativeHandle, adapter);

      this.loadedLoraAdapters.add(adapter.loraAdapterName);
      this.emit('lora:loaded', adapter.loraAdapterName);
      this.debugLog('LoRA adapter loaded successfully');

    } catch (error) {
      const rkllmError = error instanceof RKLLMError ? error : 
        new RKLLMError('LoRA loading failed', RKLLMStatusCode.ERROR_MODEL_LOAD_FAILED, error instanceof Error ? error.message : String(error));
      
      this.emit('error', rkllmError);
      throw rkllmError;
    }
  }

  /**
   * Set chat template
   */
  async setChatTemplate(config: ChatTemplateConfig): Promise<void> {
    this.ensureInitialized();

    try {
      this.debugLog('Setting chat template', { config });

      // TODO: Call native rkllm_set_chat_template when C++ bindings are available
      await this.callNativeFunction('rkllm_set_chat_template', this.nativeHandle, config);

      this.debugLog('Chat template set successfully');

    } catch (error) {
      const rkllmError = error instanceof RKLLMError ? error : 
        new RKLLMError('Chat template setting failed', RKLLMStatusCode.ERROR_INVALID_PARAM, error instanceof Error ? error.message : String(error));
      
      this.emit('error', rkllmError);
      throw rkllmError;
    }
  }

  /**
   * Set function tools
   */
  async setFunctionTools(config: FunctionToolsConfig): Promise<void> {
    this.ensureInitialized();

    try {
      this.debugLog('Setting function tools', { config });

      // TODO: Call native rkllm_set_function_tools when C++ bindings are available
      await this.callNativeFunction('rkllm_set_function_tools', this.nativeHandle, config);

      this.debugLog('Function tools set successfully');

    } catch (error) {
      const rkllmError = error instanceof RKLLMError ? error : 
        new RKLLMError('Function tools setting failed', RKLLMStatusCode.ERROR_INVALID_PARAM, error instanceof Error ? error.message : String(error));
      
      this.emit('error', rkllmError);
      throw rkllmError;
    }
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  /**
   * Load prompt cache
   */
  async loadPromptCache(cachePath: string): Promise<void> {
    this.ensureInitialized();

    try {
      this.debugLog('Loading prompt cache', { cachePath });

      // TODO: Call native rkllm_load_prompt_cache when C++ bindings are available
      await this.callNativeFunction('rkllm_load_prompt_cache', this.nativeHandle, cachePath);

      this.emit('cache:loaded', cachePath);
      this.debugLog('Prompt cache loaded successfully');

    } catch (error) {
      const rkllmError = error instanceof RKLLMError ? error : 
        new RKLLMError('Cache loading failed', RKLLMStatusCode.ERROR_FILE_NOT_FOUND, error instanceof Error ? error.message : String(error));
      
      this.emit('error', rkllmError);
      throw rkllmError;
    }
  }

  /**
   * Release prompt cache
   */
  async releasePromptCache(): Promise<void> {
    this.ensureInitialized();

    try {
      this.debugLog('Releasing prompt cache');

      // TODO: Call native rkllm_release_prompt_cache when C++ bindings are available
      await this.callNativeFunction('rkllm_release_prompt_cache', this.nativeHandle);

      this.emit('cache:cleared');
      this.debugLog('Prompt cache released successfully');

    } catch (error) {
      const rkllmError = error instanceof RKLLMError ? error : 
        new RKLLMError('Cache release failed', RKLLMStatusCode.ERROR_UNKNOWN, error instanceof Error ? error.message : String(error));
      
      this.emit('error', rkllmError);
      throw rkllmError;
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get current configuration
   */
  getConfig(): Readonly<RKLLMClientConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Check if client is initialized
   */
  isClientInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get loaded LoRA adapters
   */
  getLoadedLoraAdapters(): string[] {
    return Array.from(this.loadedLoraAdapters);
  }

  /**
   * Create default parameters (legacy method for compatibility)
   */
  static createDefaultParams(options: DefaultParamOptions): RKLLMParam {
    return {
      modelPath: options.modelPath,
      maxContextLen: options.maxContextLen ?? 4096,
      maxNewTokens: options.maxNewTokens ?? 512,
      topK: options.topK ?? 40,
      nKeep: 0,
      topP: options.topP ?? 0.9,
      temperature: options.temperature ?? 0.7,
      repeatPenalty: 1.1,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      mirostat: 0,
      mirostatTau: 5.0,
      mirostatEta: 0.1,
      skipSpecialToken: false,
      isAsync: true,
      extendParam: {
        baseDomainId: 0,
        embedFlash: false,
        enabledCpusNum: 4,
        enabledCpusMask: 0x0F,
        nBatch: 1,
        useCrossAttn: false,
      },
    };
  }

  /**
   * Get default parameters from native binding (aligned with PR #34)
   * Falls back to hardcoded defaults if native binding not available
   */
  static async getDefaultParameters(modelPath?: string): Promise<RKLLMParam> {
    try {
      // Try to load native binding from PR #34
      const binding = require('../../build/Release/binding.node');
      const nativeParam = await binding.createDefaultParam();
      
      // Convert from PR #34's format to our format
      return {
        modelPath: modelPath || nativeParam.model_path || '',
        maxContextLen: nativeParam.max_context_len,
        maxNewTokens: nativeParam.max_new_tokens,
        topK: nativeParam.top_k,
        topP: nativeParam.top_p,
        temperature: nativeParam.temperature,
        repeatPenalty: nativeParam.repeat_penalty || 1.1,
        frequencyPenalty: nativeParam.frequency_penalty || 0.0,
        presencePenalty: nativeParam.presence_penalty || 0.0,
        mirostat: nativeParam.mirostat || 0,
        mirostatTau: nativeParam.mirostat_tau || 5.0,
        mirostatEta: nativeParam.mirostat_eta || 0.1,
        skipSpecialToken: nativeParam.skip_special_token || false,
        isAsync: nativeParam.is_async !== undefined ? nativeParam.is_async : true,
        nKeep: 0, // Not in native param, use default
        extendParam: {
          baseDomainId: 0,
          embedFlash: false,
          enabledCpusNum: 4,
          enabledCpusMask: 0x0F,
          nBatch: 1,
          useCrossAttn: false,
        },
      };
    } catch (error) {
      // Fallback to hardcoded defaults if native binding not available
      return {
        modelPath: modelPath || '',
        maxContextLen: 4096,
        maxNewTokens: 512,
        topK: 40,
        topP: 0.9,
        temperature: 0.7,
        repeatPenalty: 1.1,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        mirostat: 0,
        mirostatTau: 5.0,
        mirostatEta: 0.1,
        skipSpecialToken: false,
        isAsync: true,
        nKeep: 0,
        extendParam: {
          baseDomainId: 0,
          embedFlash: false,
          enabledCpusNum: 4,
          enabledCpusMask: 0x0F,
          nBatch: 1,
          useCrossAttn: false,
        },
      };
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new RKLLMError('Client not initialized', RKLLMStatusCode.ERROR_INVALID_HANDLE);
    }
  }

  private debugLog(message: string, data?: any): void {
    if (this.config.enableEventLogging) {
      this.emit('debug', message, data);
    }
  }

  /**
   * Load native binding - required for production use
   */
  private loadNativeBinding(): any {
    try {
      // Load the compiled binding
      const binding = require('../../build/Release/binding.node');
      this.debugLog('Loaded native RKLLM binding successfully');
      return binding;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.debugLog('Failed to load native binding', { error: errorMsg });
      throw new RKLLMError(
        `Native RKLLM binding not available: ${errorMsg}. Please build the native module first.`,
        RKLLMStatusCode.ERROR_NATIVE_BINDING_NOT_AVAILABLE
      );
    }
  }

  /**
   * Call native function - no mock fallback for production
   */
  private async callNativeFunction(functionName: string, ...args: any[]): Promise<any> {
    const nativeBinding = this.loadNativeBinding();
    
    try {
      switch (functionName) {
        case 'rkllm_init': {
          const param = this.convertToRKLLMParam(args[0]);
          const handleId = await nativeBinding.init(param);
          this.debugLog(`Native call successful: ${functionName}`, { handleId });
          return { status: RKLLMStatusCode.SUCCESS, handleId };
        }
        
        case 'rkllm_destroy': {
          if (args[0] && args[0].handleId) {
            const result = await nativeBinding.destroy(args[0].handleId);
            this.debugLog(`Native call successful: ${functionName}`, { result });
            return { status: result === 0 ? RKLLMStatusCode.SUCCESS : RKLLMStatusCode.ERROR_UNKNOWN };
          }
          throw new Error('Handle ID required for destroy operation');
        }
        
        case 'rkllm_run': {
          const [handleId, input, inferParams] = args;
          const result = await nativeBinding.run(handleId, input, inferParams);
          this.debugLog(`Native call successful: ${functionName}`, { result });
          return { status: RKLLMStatusCode.SUCCESS, result };
        }
        
        case 'rkllm_abort': {
          if (args[0] && args[0].handleId) {
            const result = await nativeBinding.abort(args[0].handleId);
            this.debugLog(`Native call successful: ${functionName}`, { result });
            return { status: result === 0 ? RKLLMStatusCode.SUCCESS : RKLLMStatusCode.ERROR_UNKNOWN };
          }
          throw new Error('Handle ID required for abort operation');
        }
        
        case 'rkllm_load_lora': {
          const [handleId, adapter] = args;
          const result = await nativeBinding.loadLora(handleId, adapter);
          this.debugLog(`Native call successful: ${functionName}`, { result });
          return { status: result === 0 ? RKLLMStatusCode.SUCCESS : RKLLMStatusCode.ERROR_UNKNOWN };
        }
        
        case 'rkllm_set_chat_template': {
          const [handleId, config] = args;
          const result = await nativeBinding.setChatTemplate(handleId, config);
          this.debugLog(`Native call successful: ${functionName}`, { result });
          return { status: result === 0 ? RKLLMStatusCode.SUCCESS : RKLLMStatusCode.ERROR_UNKNOWN };
        }
        
        case 'rkllm_set_function_tools': {
          const [handleId, config] = args;
          const result = await nativeBinding.setFunctionTools(handleId, config);
          this.debugLog(`Native call successful: ${functionName}`, { result });
          return { status: result === 0 ? RKLLMStatusCode.SUCCESS : RKLLMStatusCode.ERROR_UNKNOWN };
        }
        
        case 'rkllm_load_prompt_cache': {
          const [handleId, cachePath] = args;
          const result = await nativeBinding.loadPromptCache(handleId, cachePath);
          this.debugLog(`Native call successful: ${functionName}`, { result });
          return { status: result === 0 ? RKLLMStatusCode.SUCCESS : RKLLMStatusCode.ERROR_UNKNOWN };
        }
        
        case 'rkllm_release_prompt_cache': {
          const [handleId] = args;
          const result = await nativeBinding.releasePromptCache(handleId);
          this.debugLog(`Native call successful: ${functionName}`, { result });
          return { status: result === 0 ? RKLLMStatusCode.SUCCESS : RKLLMStatusCode.ERROR_UNKNOWN };
        }
        
        default:
          throw new Error(`Unknown native function: ${functionName}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.debugLog(`Native call failed: ${functionName}`, { error: errorMsg });
      throw new RKLLMError(
        `Native call ${functionName} failed: ${errorMsg}`,
        RKLLMStatusCode.ERROR_NATIVE_CALL_FAILED
      );
    }
  }

  /**
   * Convert RKLLMClientConfig to RKLLMParam format expected by PR #34 bindings
   */
  private convertToRKLLMParam(config: any): any {
    // Align with PR #34's RKLLMParam interface
    return {
      model_path: this.modelPath,
      max_context_len: config.maxContextLen || this.config.maxContextLen,
      max_new_tokens: config.maxNewTokens || this.config.maxNewTokens,
      top_k: config.topK || this.config.topK,
      top_p: config.topP || this.config.topP,
      temperature: config.temperature || this.config.temperature,
      repeat_penalty: config.repeatPenalty || this.config.repeatPenalty,
      frequency_penalty: config.frequencyPenalty || this.config.frequencyPenalty,
      presence_penalty: config.presencePenalty || this.config.presencePenalty,
      mirostat: config.mirostat || this.config.mirostat,
      mirostat_tau: config.mirostatTau || this.config.mirostatTau,
      mirostat_eta: config.mirostatEta || this.config.mirostatEta,
      skip_special_token: config.skipSpecialToken || this.config.skipSpecialToken,
      is_async: config.isAsync !== undefined ? config.isAsync : this.config.isAsync,
    };
  }

  /**
   * Run inference using native RKLLM library
   */
  private async runInference(
    input: RKLLMInput, 
    inferParams: RKLLMInferParam, 
    callback: LLMResultCallback,
    _options: InferenceOptions
  ): Promise<RKLLMResult> {
    if (!this.nativeHandle) {
      throw new RKLLMError('RKLLM not initialized', RKLLMStatusCode.ERROR_INVALID_HANDLE);
    }

    try {
      const result = await this.callNativeFunction('rkllm_run', this.nativeHandle, input, inferParams);
      
      if (result.status !== RKLLMStatusCode.SUCCESS) {
        throw new RKLLMError('Inference failed', result.status);
      }

      // Convert native result to RKLLMResult format
      const rkllmResult: RKLLMResult = {
        text: result.result.text || '',
        tokenId: result.result.tokenId || 0,
        perf: result.result.perf || {
          prefillTimeMs: 0,
          prefillTokens: 0,
          generateTimeMs: 0,
          generateTokens: 0,
          memoryUsageMb: 0,
        },
      };

      // Call the callback with the result
      await callback(rkllmResult, LLMCallState.FINISH);
      
      return rkllmResult;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new RKLLMError(`Inference failed: ${errorMsg}`, RKLLMStatusCode.ERROR_INFERENCE_FAILED);
    }
  }
}

// Export the interface separately to avoid declaration merging issues
export interface IRKLLMClient {
  on<K extends keyof RKLLMClientEvents>(event: K, listener: RKLLMClientEvents[K]): this;
  off<K extends keyof RKLLMClientEvents>(event: K, listener: RKLLMClientEvents[K]): this;
  emit<K extends keyof RKLLMClientEvents>(event: K, ...args: Parameters<RKLLMClientEvents[K]>): boolean;
}