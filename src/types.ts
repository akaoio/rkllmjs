/**
 * Rockchip LLM Runtime JavaScript Bindings
 * High-performance interface for running LLMs on Rockchip NPUs
 */

/**
 * LLM call state enumeration
 */
export enum LLMCallState {
  NORMAL = 0,   // The LLM call is in a normal running state
  WAITING = 1,  // The LLM call is waiting for complete UTF-8 encoded character
  FINISH = 2,   // The LLM call has finished execution
  ERROR = 3,    // An error occurred during the LLM call
}

/**
 * Input type enumeration for LLM inference
 */
export enum RKLLMInputType {
  PROMPT = 0,      // Input is a text prompt
  TOKEN = 1,       // Input is a sequence of tokens
  EMBED = 2,       // Input is an embedding vector
  MULTIMODAL = 3,  // Input is multimodal (e.g., text and image)
}

/**
 * Inference mode enumeration
 */
export enum RKLLMInferMode {
  GENERATE = 0,                 // Generate text based on input
  GET_LAST_HIDDEN_LAYER = 1,   // Retrieve the last hidden layer
  GET_LOGITS = 2,              // Retrieve logits for further processing
}

/**
 * Extended parameters for LLM configuration
 */
export interface RKLLMExtendParam {
  baseDomainId?: number;       // Base domain ID
  embedFlash?: boolean;        // Query word embedding vectors from flash memory
  enabledCpusNum?: number;     // Number of CPUs enabled for inference
  enabledCpusMask?: number;    // Bitmask indicating which CPUs to enable
  nBatch?: number;             // Number of input samples processed concurrently (default: 1)
  useCrossAttn?: boolean;      // Whether to enable cross attention
}

/**
 * Main LLM configuration parameters
 */
export interface RKLLMParam {
  modelPath: string;           // Path to the model file
  maxContextLen?: number;      // Maximum number of tokens in context window
  maxNewTokens?: number;       // Maximum number of new tokens to generate
  topK?: number;              // Top-K sampling parameter
  nKeep?: number;             // Number of kv cache to keep when shifting context
  topP?: number;              // Top-P (nucleus) sampling parameter
  temperature?: number;        // Sampling temperature
  repeatPenalty?: number;      // Penalty for repeating tokens
  frequencyPenalty?: number;   // Penalizes frequent tokens
  presencePenalty?: number;    // Penalizes tokens based on presence in input
  mirostat?: number;          // Mirostat sampling strategy flag
  mirostatTau?: number;       // Tau parameter for Mirostat sampling
  mirostatEta?: number;       // Eta parameter for Mirostat sampling
  skipSpecialToken?: boolean;  // Whether to skip special tokens
  isAsync?: boolean;          // Whether to run inference asynchronously
  imgStart?: string;          // Starting position of image in multimodal input
  imgEnd?: string;            // Ending position of image in multimodal input
  imgContent?: string;        // Pointer to the image content
  extendParam?: RKLLMExtendParam; // Extended parameters
}

/**
 * LoRA adapter configuration
 */
export interface RKLLMLoraAdapter {
  loraPath: string;           // Path to the LoRA adapter file
  scale?: number;             // Scaling factor for the adapter
}

/**
 * Input data for LLM inference
 */
export interface RKLLMInput {
  inputType: RKLLMInputType;  // Type of input data
  inputData: string | number[] | Uint8Array; // The actual input data
  inputLen?: number;          // Length of input data
}

/**
 * Result from LLM inference
 */
export interface RKLLMResult {
  text?: string;              // Generated text output
  state: LLMCallState;        // Current state of the LLM call
  tokens?: number[];          // Generated tokens (if requested)
  logits?: number[];          // Logits output (if requested)
  hiddenStates?: number[];    // Hidden states (if requested)
}

/**
 * Callback function type for streaming inference
 */
export type RKLLMCallback = (result: RKLLMResult, userdata?: any) => void;

/**
 * Options for streaming inference
 */
export interface StreamOptions {
  callback: RKLLMCallback;    // Callback function for each token
  userdata?: any;             // Optional user data passed to callback
}
