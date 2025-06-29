/**
 * TypeScript interfaces for RKLLM C API structures
 * Mirrors the definitions from libs/rkllm/include/rkllm.h
 */

// ============================================================================
// Enums and Constants
// ============================================================================

/**
 * CPU core constants for CPU mask configuration
 */
export const CPU_CORES = {
  CPU0: 1 << 0,  // 0x01
  CPU1: 1 << 1,  // 0x02
  CPU2: 1 << 2,  // 0x04
  CPU3: 1 << 3,  // 0x08
  CPU4: 1 << 4,  // 0x10
  CPU5: 1 << 5,  // 0x20
  CPU6: 1 << 6,  // 0x40
  CPU7: 1 << 7,  // 0x80
} as const;

/**
 * LLM call states - describes the possible states of an LLM call
 */
export enum LLMCallState {
  NORMAL = 0,   // The LLM call is in a normal running state
  WAITING = 1,  // The LLM call is waiting for complete UTF-8 encoded character
  FINISH = 2,   // The LLM call has finished execution
  ERROR = 3,    // An error occurred during the LLM call
}

/**
 * Input types that can be fed into the LLM
 */
export enum RKLLMInputType {
  PROMPT = 0,      // Input is a text prompt
  TOKEN = 1,       // Input is a sequence of tokens
  EMBED = 2,       // Input is an embedding vector
  MULTIMODAL = 3,  // Input is multimodal (e.g., text and image)
}

/**
 * Inference modes of the LLM
 */
export enum RKLLMInferMode {
  GENERATE = 0,                 // The LLM generates text based on input
  GET_LAST_HIDDEN_LAYER = 1,    // The LLM retrieves the last hidden layer
  GET_LOGITS = 2,              // The LLM retrieves logits
}

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * Extended parameters for configuring an LLM instance
 */
export interface RKLLMExtendParam {
  baseDomainId: number;
  embedFlash: boolean;           // Query word embedding vectors from flash memory
  enabledCpusNum: number;        // Number of CPUs enabled for inference
  enabledCpusMask: number;       // Bitmask indicating which CPUs to enable
  nBatch: number;                // Number of input samples processed concurrently
  useCrossAttn: boolean;         // Whether to enable cross attention
}

/**
 * Main parameters for configuring an LLM instance
 */
export interface RKLLMParam {
  modelPath: string;             // Path to the model file
  maxContextLen: number;         // Maximum number of tokens in context window
  maxNewTokens: number;          // Maximum number of new tokens to generate
  topK: number;                  // Top-K sampling parameter
  nKeep: number;                 // Number of KV cache to keep at beginning
  topP: number;                  // Top-P (nucleus) sampling parameter
  temperature: number;           // Sampling temperature
  repeatPenalty: number;         // Penalty for repeating tokens
  frequencyPenalty: number;      // Penalizes frequent tokens
  presencePenalty: number;       // Penalizes tokens based on presence
  mirostat: number;              // Mirostat sampling strategy flag
  mirostatTau: number;           // Tau parameter for Mirostat sampling
  mirostatEta: number;           // Eta parameter for Mirostat sampling
  skipSpecialToken: boolean;     // Whether to skip special tokens
  isAsync: boolean;              // Whether to run inference asynchronously
  imgStart?: string;             // Starting position of image in multimodal input
  imgEnd?: string;               // Ending position of image in multimodal input
  imgContent?: string;           // Pointer to image content
  extendParam: RKLLMExtendParam; // Extended parameters
}

// ============================================================================
// Input Structures
// ============================================================================

/**
 * LoRA adapter configuration
 */
export interface RKLLMLoraAdapter {
  loraAdapterPath: string;       // Path to the LoRA adapter file
  loraAdapterName: string;       // Name of the LoRA adapter
  scale: number;                 // Scaling factor for applying the LoRA adapter
}

/**
 * Embedding input to the LLM
 */
export interface RKLLMEmbedInput {
  embed: Float32Array;           // Embedding vector (n_tokens * n_embed)
  nTokens: number;               // Number of tokens represented
}

/**
 * Token input to the LLM
 */
export interface RKLLMTokenInput {
  inputIds: Int32Array;          // Array of token IDs
  nTokens: number;               // Number of tokens in the input
}

/**
 * Multimodal input (text and image)
 */
export interface RKLLMMultiModelInput {
  prompt: string;                // Text prompt input
  imageEmbed: Float32Array;      // Embedding of images
  nImageTokens: number;          // Number of image tokens
  nImage: number;                // Number of images
  imageWidth: number;            // Width of image
  imageHeight: number;           // Height of image
}

/**
 * Union type for different input types
 */
export interface RKLLMInput {
  role?: string;                 // Message role: "user" or "tool"
  enableThinking?: boolean;      // Controls "thinking mode" for Qwen3 model
  inputType: RKLLMInputType;     // Type of input provided
  promptInput?: string;          // Text prompt (if inputType is PROMPT)
  embedInput?: RKLLMEmbedInput;  // Embedding input (if inputType is EMBED)
  tokenInput?: RKLLMTokenInput;  // Token input (if inputType is TOKEN)
  multimodalInput?: RKLLMMultiModelInput; // Multimodal input (if inputType is MULTIMODAL)
}

// ============================================================================
// Inference Parameters
// ============================================================================

/**
 * LoRA adapter parameters for inference
 */
export interface RKLLMLoraParam {
  loraAdapterName: string;       // Name of the LoRA adapter
}

/**
 * Prompt cache parameters
 */
export interface RKLLMPromptCacheParam {
  savePromptCache: boolean;      // Whether to save the prompt cache
  promptCachePath?: string;      // Path to the prompt cache file
}

/**
 * Cross-attention parameters for decoder
 */
export interface RKLLMCrossAttnParam {
  encoderKCache: Float32Array;   // Encoder key cache
  encoderVCache: Float32Array;   // Encoder value cache
  encoderMask: Float32Array;     // Encoder attention mask
  encoderPos: Int32Array;        // Encoder token positions
  numTokens: number;             // Number of tokens in encoder sequence
}

/**
 * Parameters for inference
 */
export interface RKLLMInferParam {
  mode: RKLLMInferMode;          // Inference mode
  loraParams?: RKLLMLoraParam;   // LoRA adapter parameters
  promptCacheParams?: RKLLMPromptCacheParam; // Prompt cache parameters
  keepHistory: boolean;          // Whether to keep history
}

// ============================================================================
// Result Structures
// ============================================================================

/**
 * Hidden states from the last layer
 */
export interface RKLLMResultLastHiddenLayer {
  hiddenStates: Float32Array;    // Hidden states (num_tokens * embd_size)
  embdSize: number;              // Size of embedding vector
  numTokens: number;             // Number of tokens
}

/**
 * Logits result
 */
export interface RKLLMResultLogits {
  logits: Float32Array;          // Logits (num_tokens * vocab_size)
  vocabSize: number;             // Size of vocabulary
  numTokens: number;             // Number of tokens
}

/**
 * Performance statistics
 */
export interface RKLLMPerfStat {
  prefillTimeMs: number;         // Time for prefill stage in milliseconds
  prefillTokens: number;         // Number of tokens in prefill stage
  generateTimeMs: number;        // Time for generate stage in milliseconds
  generateTokens: number;        // Number of tokens in generate stage
  memoryUsageMb: number;         // Memory usage in megabytes
}

/**
 * Complete result of LLM inference
 */
export interface RKLLMResult {
  text?: string;                 // Generated text result
  tokenId?: number;              // ID of the generated token
  lastHiddenLayer?: RKLLMResultLastHiddenLayer; // Hidden states (if requested)
  logits?: RKLLMResultLogits;    // Model output logits (if requested)
  perf?: RKLLMPerfStat;          // Performance statistics
}

// ============================================================================
// Callback Types
// ============================================================================

/**
 * Callback function for handling LLM results
 * @param result - The LLM result
 * @param state - State of the LLM call
 * @returns 0 to continue inference, 1 to pause inference
 */
export type LLMResultCallback = (
  result: RKLLMResult,
  state: LLMCallState
) => Promise<number> | number;

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Options for creating default parameters
 */
export interface DefaultParamOptions {
  modelPath: string;
  maxContextLen?: number;
  maxNewTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
}

/**
 * Configuration for chat template
 */
export interface ChatTemplateConfig {
  systemPrompt?: string;
  promptPrefix?: string;
  promptPostfix?: string;
}

/**
 * Configuration for function tools
 */
export interface FunctionToolsConfig {
  systemPrompt?: string;
  tools?: string;                // JSON-formatted string defining functions
  toolResponseStr?: string;      // Unique tag for function call results
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * RKLLM-specific error class
 */
export class RKLLMError extends Error {
  constructor(
    message: string,
    public readonly code: number = -1,
    public readonly context?: string
  ) {
    super(message);
    this.name = 'RKLLMError';
  }
}

/**
 * Result status codes
 */
export enum RKLLMStatusCode {
  SUCCESS = 0,
  ERROR_UNKNOWN = -1,
  ERROR_INVALID_HANDLE = -2,
  ERROR_INVALID_PARAM = -3,
  ERROR_MODEL_LOAD_FAILED = -4,
  ERROR_INFERENCE_FAILED = -5,
  ERROR_MEMORY_ALLOCATION = -6,
  ERROR_FILE_NOT_FOUND = -7,
  ERROR_TASK_RUNNING = -8,
  ERROR_NATIVE_BINDING_NOT_AVAILABLE = -9,
  ERROR_NATIVE_CALL_FAILED = -10,
}