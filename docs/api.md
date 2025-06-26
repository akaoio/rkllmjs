# API Reference

## Classes

### RKLLM

Main class for interacting with Rockchip LLM Runtime.

#### Constructor

```typescript
constructor()
```

Creates a new RKLLM instance. The instance must be initialized with `init()` before use.

#### Methods

##### init(params: RKLLMParam): Promise\<void\>

Initializes the LLM with the given parameters.

**Parameters:**
- `params` - Configuration parameters for the LLM

**Throws:**
- `Error` if already initialized
- `Error` if initialization fails

**Example:**
```typescript
const llm = new RKLLM();
await llm.init({
  modelPath: '/path/to/model.rkllm',
  maxContextLen: 2048,
  temperature: 0.7,
});
```

##### run(input: RKLLMInput): Promise\<RKLLMResult\>

Runs inference with the given input.

**Parameters:**
- `input` - Input data for inference

**Returns:**
- Promise resolving to inference result

**Throws:**
- `Error` if not initialized
- `Error` if inference fails

**Example:**
```typescript
const result = await llm.run({
  inputType: RKLLMInputType.PROMPT,
  inputData: "Hello, how are you?",
});
console.log(result.text);
```

##### runStream(input: RKLLMInput, options: StreamOptions): Promise\<void\>

Runs streaming inference with callback.

**Parameters:**
- `input` - Input data for inference
- `options` - Streaming options including callback function

**Example:**
```typescript
await llm.runStream(
  {
    inputType: RKLLMInputType.PROMPT,
    inputData: "Tell me a story:",
  },
  {
    callback: (result) => {
      if (result.text) {
        process.stdout.write(result.text);
      }
    }
  }
);
```

##### loadLoraAdapter(adapter: RKLLMLoraAdapter): Promise\<void\>

Loads a LoRA adapter for fine-tuning.

**Parameters:**
- `adapter` - LoRA adapter configuration

**Example:**
```typescript
await llm.loadLoraAdapter({
  loraPath: '/path/to/adapter.bin',
  scale: 1.0
});
```

##### unloadLoraAdapter(): Promise\<void\>

Unloads the current LoRA adapter.

##### getContextLength(): number

Returns the current context length.

##### clearContext(): Promise\<void\>

Clears the current context.

##### destroy(): Promise\<void\>

Destroys the LLM instance and frees resources.

#### Properties

##### initialized: boolean

Read-only property indicating whether the LLM is initialized.

## Interfaces

### RKLLMParam

Configuration parameters for LLM initialization.

```typescript
interface RKLLMParam {
  modelPath: string;           // Path to the model file (required)
  maxContextLen?: number;      // Maximum context window size (default: 1024)
  maxNewTokens?: number;       // Maximum tokens to generate (default: 256)
  topK?: number;              // Top-K sampling parameter (default: 50)
  nKeep?: number;             // Number of kv cache to keep (default: 0)
  topP?: number;              // Top-P sampling parameter (default: 0.9)
  temperature?: number;        // Sampling temperature (default: 0.7)
  repeatPenalty?: number;      // Repetition penalty (default: 1.1)
  frequencyPenalty?: number;   // Frequency penalty (default: 0.0)
  presencePenalty?: number;    // Presence penalty (default: 0.0)
  mirostat?: number;          // Mirostat sampling strategy (default: 0)
  mirostatTau?: number;       // Tau parameter for Mirostat (default: 5.0)
  mirostatEta?: number;       // Eta parameter for Mirostat (default: 0.1)
  skipSpecialToken?: boolean;  // Skip special tokens (default: false)
  isAsync?: boolean;          // Enable async mode (default: false)
  imgStart?: string;          // Image start marker for multimodal
  imgEnd?: string;            // Image end marker for multimodal
  imgContent?: string;        // Image content for multimodal
  extendParam?: RKLLMExtendParam; // Extended parameters
}
```

### RKLLMExtendParam

Extended configuration parameters.

```typescript
interface RKLLMExtendParam {
  baseDomainId?: number;       // Base domain ID
  embedFlash?: boolean;        // Query embeddings from flash memory
  enabledCpusNum?: number;     // Number of CPUs to enable
  enabledCpusMask?: number;    // CPU mask for specific core assignment
  nBatch?: number;             // Batch size for processing (default: 1)
  useCrossAttn?: boolean;      // Enable cross attention
}
```

### RKLLMInput

Input data for inference.

```typescript
interface RKLLMInput {
  inputType: RKLLMInputType;   // Type of input data
  inputData: string | number[] | Uint8Array; // The actual input data
  inputLen?: number;           // Length of input data
}
```

### RKLLMResult

Result from inference.

```typescript
interface RKLLMResult {
  text?: string;               // Generated text output
  state: LLMCallState;         // Current state of the LLM call
  tokens?: number[];           // Generated tokens (if requested)
  logits?: number[];           // Logits output (if requested)
  hiddenStates?: number[];     // Hidden states (if requested)
}
```

### RKLLMLoraAdapter

LoRA adapter configuration.

```typescript
interface RKLLMLoraAdapter {
  loraPath: string;            // Path to the LoRA adapter file
  scale?: number;              // Scaling factor for the adapter
}
```

### StreamOptions

Options for streaming inference.

```typescript
interface StreamOptions {
  callback: RKLLMCallback;     // Callback function for each token
  userdata?: any;              // Optional user data passed to callback
}
```

## Enums

### LLMCallState

Enumeration of LLM call states.

```typescript
enum LLMCallState {
  NORMAL = 0,   // Normal running state
  WAITING = 1,  // Waiting for complete UTF-8 character
  FINISH = 2,   // Finished execution
  ERROR = 3,    // Error occurred
}
```

### RKLLMInputType

Enumeration of input types.

```typescript
enum RKLLMInputType {
  PROMPT = 0,      // Text prompt
  TOKEN = 1,       // Token sequence
  EMBED = 2,       // Embedding vector
  MULTIMODAL = 3,  // Multimodal input
}
```

### RKLLMInferMode

Enumeration of inference modes.

```typescript
enum RKLLMInferMode {
  GENERATE = 0,                 // Generate text
  GET_LAST_HIDDEN_LAYER = 1,   // Get last hidden layer
  GET_LOGITS = 2,              // Get logits
}
```

## Type Aliases

### RKLLMCallback

Callback function type for streaming inference.

```typescript
type RKLLMCallback = (result: RKLLMResult, userdata?: any) => void;
```

## Utility Functions

### createRKLLM(params: RKLLMParam): Promise\<RKLLM\>

Convenience function to create and initialize an RKLLM instance in one call.

**Parameters:**
- `params` - Configuration parameters

**Returns:**
- Promise resolving to initialized RKLLM instance

**Example:**
```typescript
const llm = await createRKLLM({
  modelPath: '/path/to/model.rkllm',
  temperature: 0.8,
});
```
