# RKLLM Client

## Purpose

Provides a high-level, Promise-based TypeScript wrapper for the RKLLM (Rockchip Large Language Model) C++ library. The RKLLMClient class offers an intuitive, event-driven API that simplifies LLM inference operations while maintaining full access to the underlying C API capabilities.

## Architecture

The RKLLM Client serves as the primary interface between TypeScript applications and the native RKLLM library:

```
Application Layer
├── RKLLMClient (High-level API)
│   ├── Promise-based methods
│   ├── Event-driven architecture  
│   ├── Automatic resource management
│   └── Error handling & validation
├── RKLLM Types (Type definitions)
└── C++ N-API Bindings (Native layer)
    └── librkllmrt.so (Rockchip library)
```

### Key Features

- **Promise-based API**: Modern async/await patterns for all operations
- **Event-driven**: Rich event system for real-time inference monitoring
- **Type-safe**: Full TypeScript type definitions and validation
- **Resource management**: Automatic initialization and cleanup
- **Error handling**: Comprehensive error types with detailed context
- **Configuration**: Flexible configuration with sensible defaults
- **Streaming support**: Token-by-token generation with callbacks
- **Abort control**: Cancellation support for long-running operations

## Core Components

### RKLLMClient Class

The main client class providing all inference and management functionality:

```typescript
import { RKLLMClient } from './rkllm-client';

const client = new RKLLMClient({
  modelPath: '/path/to/model.rkllm',
  maxContextLen: 4096,
  maxNewTokens: 512,
  temperature: 0.7,
});
```

### Configuration Interface

```typescript
interface RKLLMClientConfig {
  modelPath: string;                    // Required: path to model file
  autoInit?: boolean;                   // Auto-initialize on creation
  enableEventLogging?: boolean;         // Enable detailed event logging
  callbackTimeout?: number;             // Callback timeout in ms
  maxRetries?: number;                  // Max retry attempts
  retryDelay?: number;                  // Delay between retries
  
  // Model parameters (extends RKLLMParam)
  maxContextLen?: number;               // Context window size
  maxNewTokens?: number;                // Max tokens to generate
  temperature?: number;                 // Sampling temperature
  topP?: number;                        // Top-P sampling
  topK?: number;                        // Top-K sampling
  // ... other model parameters
}
```

## Usage Examples

### Basic Text Generation

```typescript
import { RKLLMClient } from './rkllm-client';

const client = new RKLLMClient({
  modelPath: '/path/to/qwen-model.rkllm',
  temperature: 0.7,
  maxNewTokens: 512,
});

// Generate text from prompt
const result = await client.generate('What is artificial intelligence?');
console.log('Generated text:', result.text);
console.log('Performance:', result.performance);
```

### Streaming Generation

```typescript
const client = new RKLLMClient({
  modelPath: '/path/to/model.rkllm',
  enableEventLogging: true,
});

await client.initialize();

// Set up streaming callbacks
const result = await client.generate('Explain quantum computing', {
  streaming: true,
  onToken: (token) => {
    process.stdout.write(token); // Stream tokens as they're generated
  },
  onProgress: (progress) => {
    console.log(`Progress: ${(progress * 100).toFixed(1)}%`);
  },
});

console.log('\nGeneration completed!');
console.log(`Total tokens: ${result.tokenCount}`);
console.log(`Speed: ${result.performance.tokensPerSecond.toFixed(2)} tokens/sec`);
```

### Event-Driven Inference

```typescript
const client = new RKLLMClient({
  modelPath: '/path/to/model.rkllm',
  enableEventLogging: true,
});

// Listen to inference events
client.on('inference:start', (input) => {
  console.log('Inference started:', input.promptInput);
});

client.on('inference:token', (token, tokenId) => {
  console.log(`Token ${tokenId}: "${token}"`);
});

client.on('inference:complete', (result) => {
  console.log('Inference completed:', {
    text: result.text,
    tokenCount: result.tokenCount,
    performance: result.performance,
  });
});

client.on('error', (error) => {
  console.error('Client error:', error.message);
});

// Run inference
await client.generate('Hello, how are you?');
```

### Advanced Configuration

```typescript
import { RKLLMClient, RKLLMInferMode } from './rkllm-client';

const client = new RKLLMClient({
  modelPath: '/path/to/model.rkllm',
  maxContextLen: 8192,
  maxNewTokens: 1024,
  temperature: 0.8,
  topP: 0.9,
  topK: 40,
  extendParam: {
    baseDomainId: 0,
    embedFlash: false,
    enabledCpusNum: 8,
    enabledCpusMask: 0xFF, // Use all 8 CPU cores
    nBatch: 1,
    useCrossAttn: false,
  },
});

// Configure chat template
await client.setChatTemplate({
  systemPrompt: 'You are a helpful AI assistant.',
  promptPrefix: 'Human: ',
  promptPostfix: '\n\nAssistant: ',
});

// Generate with custom inference mode
const result = await client.generate('Explain the theory of relativity', {
  mode: RKLLMInferMode.GENERATE,
  timeout: 60000, // 60 second timeout
});
```

### Multi-Modal Input

```typescript
// Generate from token sequence
const tokens = new Int32Array([1, 2, 3, 4, 5]);
const result = await client.generateFromTokens(tokens);

// Generate from embedding
const embedding = new Float32Array([0.1, 0.2, 0.3, 0.4]);
const result = await client.generateFromEmbedding(embedding, 2);
```

### Resource Management

```typescript
const client = new RKLLMClient({
  modelPath: '/path/to/model.rkllm',
  autoInit: false, // Manual initialization
});

try {
  // Manual initialization
  await client.initialize();
  
  // Check status
  console.log('Initialized:', client.isClientInitialized());
  
  // Perform inference
  const result = await client.generate('Hello world');
  
  // Load LoRA adapter
  await client.loadLora({
    loraAdapterPath: '/path/to/adapter.bin',
    loraAdapterName: 'fine-tuned-adapter',
    scale: 1.0,
  });
  
  console.log('Loaded adapters:', client.getLoadedLoraAdapters());
  
} finally {
  // Always cleanup
  await client.destroy();
}
```

### Error Handling

```typescript
import { RKLLMError, RKLLMStatusCode } from '../rkllm-types/rkllm-types';

try {
  const result = await client.generate('Test prompt');
} catch (error) {
  if (error instanceof RKLLMError) {
    console.error(`RKLLM Error [${error.code}]: ${error.message}`);
    
    switch (error.code) {
      case RKLLMStatusCode.ERROR_MODEL_LOAD_FAILED:
        console.error('Model file not found or corrupted');
        break;
      case RKLLMStatusCode.ERROR_INVALID_PARAM:
        console.error('Invalid parameters provided');
        break;
      case RKLLMStatusCode.ERROR_TASK_RUNNING:
        console.error('Another inference is already running');
        break;
      default:
        console.error('Unknown error occurred');
    }
    
    if (error.context) {
      console.error('Error context:', error.context);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Cache Management

```typescript
// Load prompt cache for faster inference
await client.loadPromptCache('/path/to/cache.bin');

// Generate with cached prompts
const result = await client.generate('Continue the conversation...');

// Release cache when done
await client.releasePromptCache();
```

### Function Tools Integration

```typescript
// Configure function calling capabilities
await client.setFunctionTools({
  systemPrompt: 'You have access to the following functions:',
  tools: JSON.stringify({
    functions: [
      {
        name: 'get_weather',
        description: 'Get current weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: { 
              type: 'string', 
              description: 'City name' 
            },
            units: { 
              type: 'string', 
              enum: ['celsius', 'fahrenheit'],
              description: 'Temperature units'
            }
          },
          required: ['location']
        }
      },
      {
        name: 'calculate',
        description: 'Perform mathematical calculations',
        parameters: {
          type: 'object',
          properties: {
            expression: { 
              type: 'string', 
              description: 'Mathematical expression to evaluate' 
            }
          },
          required: ['expression']
        }
      }
    ]
  }),
  toolResponseStr: '<tool_response>',
});

// Generate with function calling capability
const result = await client.generate(
  'What is the weather like in London and what is 15 * 7?'
);
```

### Concurrent Usage Patterns

```typescript
// Sequential inference
async function sequentialInference() {
  const prompts = ['Question 1', 'Question 2', 'Question 3'];
  const results = [];
  
  for (const prompt of prompts) {
    const result = await client.generate(prompt);
    results.push(result);
  }
  
  return results;
}

// Multiple clients for parallel inference
async function parallelInference() {
  const clients = [
    new RKLLMClient({ modelPath: '/path/to/model1.rkllm' }),
    new RKLLMClient({ modelPath: '/path/to/model2.rkllm' }),
    new RKLLMClient({ modelPath: '/path/to/model3.rkllm' }),
  ];
  
  try {
    const results = await Promise.all([
      clients[0].generate('Prompt 1'),
      clients[1].generate('Prompt 2'),
      clients[2].generate('Prompt 3'),
    ]);
    
    return results;
  } finally {
    await Promise.all(clients.map(client => client.destroy()));
  }
}
```

## Event System

The RKLLMClient emits comprehensive events for monitoring and integration:

### Lifecycle Events
- `initialized` - Client successfully initialized
- `destroyed` - Client destroyed and resources cleaned up
- `model:loaded` - Model loaded successfully
- `model:unloaded` - Model unloaded

### Inference Events
- `inference:start` - Inference operation started
- `inference:token` - New token generated (streaming)
- `inference:progress` - Progress update (0-1)
- `inference:complete` - Inference completed successfully
- `inference:error` - Inference failed with error
- `inference:abort` - Inference was aborted

### Configuration Events
- `lora:loaded` - LoRA adapter loaded
- `lora:unloaded` - LoRA adapter unloaded
- `cache:saved` - Prompt cache saved
- `cache:loaded` - Prompt cache loaded
- `cache:cleared` - Prompt cache cleared

### Debugging Events
- `debug` - Debug information (when logging enabled)
- `warning` - Warning messages
- `error` - General error events

## Performance Considerations

### Memory Management
- Automatic resource cleanup on destroy
- Efficient handling of large embedding arrays
- Proper disposal of native handles

### Inference Optimization
- Configurable CPU core usage
- Batch processing support
- Prompt caching for repeated inference
- Streaming to reduce perceived latency

### Error Recovery
- Automatic retry with exponential backoff
- Graceful handling of model loading failures
- Proper cleanup on errors

## API Reference

### Class Methods

#### Lifecycle
- `constructor(config: RKLLMClientConfig)` - Create client instance
- `initialize(): Promise<void>` - Initialize the client
- `destroy(): Promise<void>` - Cleanup and destroy client
- `isClientInitialized(): boolean` - Check initialization status

#### Text Generation
- `generate(prompt: string, options?: InferenceOptions): Promise<InferenceResult>` - Generate from text prompt
- `generateFromTokens(tokens: Int32Array, options?: InferenceOptions): Promise<InferenceResult>` - Generate from token sequence
- `generateFromEmbedding(embedding: Float32Array, nTokens: number, options?: InferenceOptions): Promise<InferenceResult>` - Generate from embedding
- `infer(input: RKLLMInput, options?: InferenceOptions): Promise<InferenceResult>` - Core inference method

#### Control
- `abort(): Promise<void>` - Abort current inference
- `isInferenceRunning(): boolean` - Check if inference is running

#### Configuration
- `loadLora(adapter: RKLLMLoraAdapter): Promise<void>` - Load LoRA adapter
- `setChatTemplate(config: ChatTemplateConfig): Promise<void>` - Set chat template
- `setFunctionTools(config: FunctionToolsConfig): Promise<void>` - Configure function tools

#### Cache Management
- `loadPromptCache(cachePath: string): Promise<void>` - Load prompt cache
- `releasePromptCache(): Promise<void>` - Release prompt cache

#### Utilities
- `getConfig(): Readonly<RKLLMClientConfig>` - Get current configuration
- `getLoadedLoraAdapters(): string[]` - Get loaded LoRA adapter names
- `static createDefaultParams(options: DefaultParamOptions): RKLLMParam` - Create default parameters

## Dependencies

- **Node.js EventEmitter**: For event-driven architecture
- **RKLLM Types**: TypeScript type definitions
- **Future**: C++ N-API bindings (when implemented)

## Testing

The module includes comprehensive unit tests covering:

- **Constructor and configuration**: Validation of setup and defaults
- **Lifecycle management**: Initialization and destruction
- **Text generation**: All input types and options
- **Event system**: Event emission and handling
- **Error handling**: Error types and recovery
- **Resource management**: Memory and handle cleanup
- **Configuration**: LoRA, chat templates, function tools
- **Cache operations**: Loading and releasing caches

```bash
# Run client tests
npm test src/rkllm-client/rkllm-client.test.ts
```

## Design Principles

### Promise-Based API
- All operations return Promises for consistent async handling
- Proper error propagation through Promise rejection
- Support for async/await patterns

### Event-Driven Architecture
- Rich event system for real-time monitoring
- Non-blocking event emission
- Consistent event naming and data structures

### Type Safety
- Full TypeScript type coverage
- Runtime type validation where appropriate
- Immutable configuration objects

### Resource Management
- Automatic initialization and cleanup
- Proper handling of native resources
- Prevention of resource leaks

### Error Handling
- Structured error types with codes
- Detailed error context and messages
- Graceful degradation on failures

This client provides a modern, TypeScript-native interface to the powerful RKLLM library while maintaining full access to the underlying NPU acceleration capabilities.