/**
 * @module rkllm-client
 * @purpose High-level TypeScript client for RKLLM model interaction
 * @description Promise-based client API providing streamlined interface for RKLLM
 *              model operations. Features async/await support, event-driven architecture,
 *              streaming text generation, and comprehensive error handling.
 * @author RKLLMJS Team
 * @version 1.0.0
 */

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

// Import the main branch's LLM Handle Wrapper
// TODO: Import from new modular N-API bindings instead of llm-handle
// import { 
//   LLMHandleWrapper,
//   type RKLLMParam as MainRKLLMParam,
//   type RKLLMInput as MainRKLLMInput,
//   type LLMHandle
// } from '../bindings/napi-bindings/...';

// Placeholder types and mock implementation for now (llm-handle was reference code and removed)
type MainRKLLMParam = any;
type MainRKLLMInput = any;
type LLMHandle = any;

// Mock LLMHandleWrapper implementation until native bindings are ready
const LLMHandleWrapper = {
  async init(_param: MainRKLLMParam): Promise<LLMHandle> {
    throw new Error('Native bindings not yet implemented. Please wait for N-API integration.');
  },
  
  async destroy(_handle: LLMHandle): Promise<void> {
    throw new Error('Native bindings not yet implemented. Please wait for N-API integration.');
  },
  
  async run(_handle: LLMHandle, _input: MainRKLLMInput, _inferParams: any): Promise<number> {
    throw new Error('Native bindings not yet implemented. Please wait for N-API integration.');
  },
  
  async abort(_handle: LLMHandle): Promise<void> {
    throw new Error('Native bindings not yet implemented. Please wait for N-API integration.');
  },
  
  async loadLora(_handle: LLMHandle, _adapter: any): Promise<void> {
    throw new Error('Native bindings not yet implemented. Please wait for N-API integration.');
  },
  
  async setChatTemplate(_handle: LLMHandle, _system: string, _prefix: string, _postfix: string): Promise<void> {
    throw new Error('Native bindings not yet implemented. Please wait for N-API integration.');
  },
  
  async setFunctionTools(_handle: LLMHandle, _system: string, _tools: string, _response: string): Promise<void> {
    throw new Error('Native bindings not yet implemented. Please wait for N-API integration.');
  },
  
  async loadPromptCache(_handle: LLMHandle, _cachePath: string): Promise<void> {
    throw new Error('Native bindings not yet implemented. Please wait for N-API integration.');
  },
  
  async releasePromptCache(_handle: LLMHandle): Promise<void> {
    throw new Error('Native bindings not yet implemented. Please wait for N-API integration.');
  },
  
  async createDefaultParam(): Promise<MainRKLLMParam> {
    throw new Error('Native bindings not yet implemented. Please wait for N-API integration.');
  }
};

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
  
  // Dynamic inference parameters (override client defaults)
  maxNewTokens?: number;                // Override max tokens for this inference
  temperature?: number;                 // Override temperature for this inference
  topK?: number;                        // Override top-K for this inference
  topP?: number;                        // Override top-P for this inference
  repeatPenalty?: number;               // Override repeat penalty for this inference
  enableProfiler?: boolean;             // Enable performance profiling for this inference
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
  private llmHandle: LLMHandle | null = null; // Use main branch's LLMHandle type
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

      // Convert config to main branch's format
      const mainParam = this.convertToMainParam(this.config);
      
      // Use main branch's LLMHandleWrapper
      this.llmHandle = await LLMHandleWrapper.init(mainParam);
      this.debugLog('LLM Handle initialized successfully', { handle: this.llmHandle });

      this.isInitialized = true;
      
      this.emit('initialized');
      this.emit('model:loaded', this.modelPath);
      this.debugLog('RKLLM client initialized successfully');

    } catch (error) {
      // Check if the error is specifically about native bindings not being available
      const errorMessage = error instanceof Error ? error.message : String(error);
      let errorCode = RKLLMStatusCode.ERROR_MODEL_LOAD_FAILED;
      
      if (errorMessage.includes('Failed to load native binding') || 
          errorMessage.includes('Native bindings not yet implemented')) {
        errorCode = RKLLMStatusCode.ERROR_NATIVE_BINDING_NOT_AVAILABLE;
      }
      
      const rkllmError = error instanceof RKLLMError ? error : 
        new RKLLMError('Initialization failed', errorCode, errorMessage);
      
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

      // Call LLMHandleWrapper to destroy the handle
      if (this.llmHandle) {
        await LLMHandleWrapper.destroy(this.llmHandle);
        this.llmHandle = null;
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
        nTokens,
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
          tokensPerSecond,
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

      // Call LLMHandleWrapper abort method  
      if (this.llmHandle) {
        await LLMHandleWrapper.abort(this.llmHandle);
      }

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

      // Convert to main branch's LoRA adapter format and call LLMHandleWrapper
      if (this.llmHandle) {
        // Use the adapter directly as it's already in canonical format
        await LLMHandleWrapper.loadLora(this.llmHandle, adapter);
      }

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

      // Call LLMHandleWrapper setChatTemplate method
      if (this.llmHandle) {
        await LLMHandleWrapper.setChatTemplate(
          this.llmHandle, 
          config.systemPrompt || '', 
          config.promptPrefix || '[INST]', 
          config.promptPostfix || '[/INST]'
        );
      }

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

      // Call LLMHandleWrapper setFunctionTools method
      if (this.llmHandle) {
        await LLMHandleWrapper.setFunctionTools(
          this.llmHandle, 
          config.systemPrompt || '',
          JSON.stringify(config.tools),
          config.toolResponseStr || ''
        );
      }

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

      // Call LLMHandleWrapper loadPromptCache method
      if (this.llmHandle) {
        await LLMHandleWrapper.loadPromptCache(this.llmHandle, cachePath);
      }

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

      // Call LLMHandleWrapper releasePromptCache method
      if (this.llmHandle) {
        await LLMHandleWrapper.releasePromptCache(this.llmHandle);
      }

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
   * Get default parameters from LLMHandleWrapper (main branch integration)
   * Falls back to hardcoded defaults if not available
   */
  static async getDefaultParameters(modelPath?: string): Promise<RKLLMParam> {
    try {
      // Use main branch's LLMHandleWrapper to get default parameters
      const mainParam = await LLMHandleWrapper.createDefaultParam();
      
      // Convert from main branch's format to our format
      const result: RKLLMParam = {
        modelPath: modelPath || mainParam.modelPath || '',
        maxContextLen: mainParam.maxContextLen,
        maxNewTokens: mainParam.maxNewTokens,
        topK: mainParam.topK,
        topP: mainParam.topP,
        temperature: mainParam.temperature,
        repeatPenalty: mainParam.repeatPenalty || 1.1,
        frequencyPenalty: mainParam.frequencyPenalty || 0.0,
        presencePenalty: mainParam.presencePenalty || 0.0,
        mirostat: mainParam.mirostat || 0,
        mirostatTau: mainParam.mirostatTau || 5.0,
        mirostatEta: mainParam.mirostatEta || 0.1,
        skipSpecialToken: mainParam.skipSpecialToken || false,
        isAsync: mainParam.isAsync !== undefined ? mainParam.isAsync : true,
        nKeep: 0, // Not in main param, use default
        extendParam: {
          baseDomainId: mainParam.extendParam.baseDomainId,
          embedFlash: mainParam.extendParam.embedFlash,
          enabledCpusNum: mainParam.extendParam.enabledCpusNum,
          enabledCpusMask: mainParam.extendParam.enabledCpusMask,
          nBatch: mainParam.extendParam.nBatch,
          useCrossAttn: mainParam.extendParam.useCrossAttn,
        },
      };

      // Only assign optional fields if they exist
      if (mainParam.imgStart !== undefined) {
        result.imgStart = mainParam.imgStart;
      }
      if (mainParam.imgEnd !== undefined) {
        result.imgEnd = mainParam.imgEnd;
      }
      if (mainParam.imgContent !== undefined) {
        result.imgContent = mainParam.imgContent;
      }

      return result;
    } catch (error) {
      // Fallback to hardcoded defaults if LLMHandleWrapper not available
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
   * Run inference using native RKLLM library
   */
  private async runInference(
    input: RKLLMInput, 
    inferParams: RKLLMInferParam, 
    callback: LLMResultCallback,
    _options: InferenceOptions
  ): Promise<RKLLMResult> {
    if (!this.llmHandle) {
      throw new RKLLMError('RKLLM not initialized', RKLLMStatusCode.ERROR_INVALID_HANDLE);
    }

    try {
      // Convert to main branch formats
      const mainInput = this.convertToMainInput(input);
      const mainInferParams = this.convertToMainInferParams(inferParams);
      
      // Run inference using LLMHandleWrapper
      const statusCode = await LLMHandleWrapper.run(this.llmHandle, mainInput, mainInferParams);
      
      // Check status code
      if (statusCode !== 0) {
        throw new RKLLMError('Inference failed', statusCode);
      }

      // Create a result object (simplified since main branch doesn't return rich results yet)
      const rkllmResult: RKLLMResult = {
        text: '', // Will be populated by callback
        tokenId: 0,
        perf: {
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

  // ============================================================================
  // Parameter Conversion Methods
  // ============================================================================

  /**
   * Convert client config to main branch's RKLLMParam format
   */
  private convertToMainParam(config: RKLLMClientConfig): MainRKLLMParam {
    // First convert to canonical format, then to C API format
    const canonical: RKLLMParam = {
      modelPath: config.modelPath,
      maxContextLen: config.maxContextLen ?? 4096,
      maxNewTokens: config.maxNewTokens ?? 512,
      topK: config.topK ?? 40,
      nKeep: config.nKeep ?? 0,
      topP: config.topP ?? 0.9,
      temperature: config.temperature ?? 0.7,
      repeatPenalty: config.repeatPenalty ?? 1.1,
      frequencyPenalty: config.frequencyPenalty ?? 0.0,
      presencePenalty: config.presencePenalty ?? 0.0,
      mirostat: config.mirostat ?? 0,
      mirostatTau: config.mirostatTau ?? 5.0,
      mirostatEta: config.mirostatEta ?? 0.1,
      skipSpecialToken: config.skipSpecialToken ?? false,
      isAsync: config.isAsync ?? true,
      extendParam: {
        baseDomainId: config.extendParam?.baseDomainId ?? 0,
        embedFlash: config.extendParam?.embedFlash ?? false,
        enabledCpusNum: config.extendParam?.enabledCpusNum ?? 4,
        enabledCpusMask: config.extendParam?.enabledCpusMask ?? 0xFF,
        nBatch: config.extendParam?.nBatch ?? 512,
        useCrossAttn: config.extendParam?.useCrossAttn ?? false,
      },
    };

    // Only assign optional fields if they exist
    if (config.imgStart !== undefined) {
      canonical.imgStart = config.imgStart;
    }
    if (config.imgEnd !== undefined) {
      canonical.imgEnd = config.imgEnd;
    }
    if (config.imgContent !== undefined) {
      canonical.imgContent = config.imgContent;
    }

    // Use the canonical format directly (no conversion needed)
    return canonical;
  }

  /**
   * Convert client input to main branch's RKLLMInput format
   */
  private convertToMainInput(input: RKLLMInput): MainRKLLMInput {
    // Use the canonical format directly (no conversion needed)
    return input;
  }

  /**
   * Convert client infer params to main branch's format
   */
  private convertToMainInferParams(inferParams: RKLLMInferParam): RKLLMInferParam {
    const result: RKLLMInferParam = {
      mode: inferParams.mode, // Enums are now unified, no conversion needed
      keepHistory: inferParams.keepHistory
    };

    if (inferParams.loraParams) {
      result.loraParams = inferParams.loraParams;
    }

    return result;
  }
}

// Export the interface separately to avoid declaration merging issues
export interface IRKLLMClient {
  on<K extends keyof RKLLMClientEvents>(event: K, listener: RKLLMClientEvents[K]): this;
  off<K extends keyof RKLLMClientEvents>(event: K, listener: RKLLMClientEvents[K]): this;
  emit<K extends keyof RKLLMClientEvents>(event: K, ...args: Parameters<RKLLMClientEvents[K]>): boolean;
}