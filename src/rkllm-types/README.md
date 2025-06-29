# RKLLM Types

## Purpose

Provides comprehensive TypeScript type definitions for the RKLLM (Rockchip Large Language Model) C API. This module defines all interfaces, enums, and types needed to work with the native RKLLM library in a type-safe manner, mirroring the C API definitions from `libs/rkllm/include/rkllm.h`.

## Architecture

The type system is organized into several categories:

```
RKLLM Types
├── Constants & Enums
│   ├── CPU_CORES - CPU core bitmask constants
│   ├── LLMCallState - Inference call states
│   ├── RKLLMInputType - Input data types
│   ├── RKLLMInferMode - Inference modes
│   └── RKLLMStatusCode - Status/error codes
├── Core Configuration
│   ├── RKLLMParam - Main model parameters
│   └── RKLLMExtendParam - Extended configuration
├── Input Structures
│   ├── RKLLMInput - Unified input interface
│   ├── RKLLMEmbedInput - Embedding inputs
│   ├── RKLLMTokenInput - Token sequence inputs
│   └── RKLLMMultiModelInput - Multimodal inputs
├── Inference Control
│   ├── RKLLMInferParam - Inference parameters
│   ├── RKLLMLoraParam - LoRA adapter settings
│   └── RKLLMPromptCacheParam - Prompt caching
└── Results & Callbacks
    ├── RKLLMResult - Inference results
    ├── RKLLMPerfStat - Performance statistics
    └── LLMResultCallback - Result callback type
```

## Core Components

### Constants and Enums

#### CPU Core Configuration
```typescript
import { CPU_CORES } from './rkllm-types';

// Configure CPU mask for multi-core inference
const cpuMask = CPU_CORES.CPU0 | CPU_CORES.CPU1 | CPU_CORES.CPU2 | CPU_CORES.CPU3;
```

#### Call States
```typescript
import { LLMCallState } from './rkllm-types';

// Handle different inference states
switch (state) {
  case LLMCallState.NORMAL:   // Inference running normally
  case LLMCallState.WAITING:  // Waiting for UTF-8 completion
  case LLMCallState.FINISH:   // Inference completed
  case LLMCallState.ERROR:    // Error occurred
}
```

#### Input Types
```typescript
import { RKLLMInputType } from './rkllm-types';

const inputType = RKLLMInputType.PROMPT;      // Text prompt
const inputType = RKLLMInputType.TOKEN;       // Token sequence
const inputType = RKLLMInputType.EMBED;       // Embedding vector
const inputType = RKLLMInputType.MULTIMODAL;  // Text + image
```

### Configuration Interfaces

#### Main Model Parameters
```typescript
import type { RKLLMParam } from './rkllm-types';

const config: RKLLMParam = {
  modelPath: '/path/to/model.rkllm',
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
  extendParam: {
    baseDomainId: 0,
    embedFlash: false,
    enabledCpusNum: 4,
    enabledCpusMask: 0x0F,
    nBatch: 1,
    useCrossAttn: false,
  },
};
```

#### Multimodal Configuration
```typescript
// Add image processing parameters
const multimodalConfig: RKLLMParam = {
  ...config,
  imgStart: '<image>',
  imgEnd: '</image>',
  imgContent: 'base64_encoded_image_data',
};
```

### Input Structures

#### Text Prompt Input
```typescript
import type { RKLLMInput } from './rkllm-types';
import { RKLLMInputType } from './rkllm-types';

const promptInput: RKLLMInput = {
  role: 'user',
  enableThinking: false,
  inputType: RKLLMInputType.PROMPT,
  promptInput: 'Hello, how are you today?',
};
```

#### Token Sequence Input
```typescript
const tokenInput: RKLLMInput = {
  inputType: RKLLMInputType.TOKEN,
  tokenInput: {
    inputIds: new Int32Array([1, 2, 3, 4, 5]),
    nTokens: 5,
  },
};
```

#### Embedding Input
```typescript
const embedInput: RKLLMInput = {
  inputType: RKLLMInputType.EMBED,
  embedInput: {
    embed: new Float32Array([0.1, 0.2, 0.3, 0.4]),
    nTokens: 2, // 2 tokens with 2-dimensional embeddings
  },
};
```

#### Multimodal Input
```typescript
const multimodalInput: RKLLMInput = {
  inputType: RKLLMInputType.MULTIMODAL,
  multimodalInput: {
    prompt: 'Describe this image in detail',
    imageEmbed: new Float32Array([/* image embedding data */]),
    nImageTokens: 196, // 14x14 image patches
    nImage: 1,
    imageWidth: 224,
    imageHeight: 224,
  },
};
```

### Result Handling

#### Basic Result Processing
```typescript
import type { RKLLMResult, LLMResultCallback } from './rkllm-types';
import { LLMCallState } from './rkllm-types';

const callback: LLMResultCallback = async (result: RKLLMResult, state: LLLMCallState) => {
  if (result.text) {
    console.log('Generated text:', result.text);
  }
  
  if (result.perf) {
    console.log(`Performance: ${result.perf.generateTimeMs}ms for ${result.perf.generateTokens} tokens`);
  }
  
  // Return 0 to continue, 1 to pause
  return state === LLMCallState.FINISH ? 0 : 1;
};
```

#### Advanced Result Analysis
```typescript
const advancedCallback: LLMResultCallback = async (result: RKLLMResult, state: LLMCallState) => {
  // Access hidden layer states for analysis
  if (result.lastHiddenLayer) {
    const { hiddenStates, embdSize, numTokens } = result.lastHiddenLayer;
    // Process hidden states for downstream tasks
  }
  
  // Access raw logits for custom sampling
  if (result.logits) {
    const { logits, vocabSize, numTokens } = result.logits;
    // Implement custom token selection logic
  }
  
  return 0; // Continue inference
};
```

### Error Handling

#### RKLLM Error Class
```typescript
import { RKLLMError, RKLLMStatusCode } from './rkllm-types';

try {
  // RKLLM operations
} catch (error) {
  if (error instanceof RKLLMError) {
    console.error(`RKLLM Error [${error.code}]: ${error.message}`);
    if (error.context) {
      console.error('Context:', error.context);
    }
    
    // Handle specific error codes
    switch (error.code) {
      case RKLLMStatusCode.ERROR_MODEL_LOAD_FAILED:
        // Handle model loading failure
        break;
      case RKLLMStatusCode.ERROR_INVALID_PARAM:
        // Handle parameter validation error
        break;
      default:
        // Handle other errors
    }
  }
}
```

#### Custom Error Creation
```typescript
// Create custom RKLLM errors
throw new RKLLMError(
  'Model initialization failed', 
  RKLLMStatusCode.ERROR_MODEL_LOAD_FAILED,
  'Model file may be corrupted or incompatible'
);
```

## Usage Patterns

### Default Parameter Creation
```typescript
import type { DefaultParamOptions } from './rkllm-types';

const createDefaultParams = (options: DefaultParamOptions): RKLLMParam => {
  return {
    modelPath: options.modelPath,
    maxContextLen: options.maxContextLen ?? 4096,
    maxNewTokens: options.maxNewTokens ?? 512,
    temperature: options.temperature ?? 0.7,
    topP: options.topP ?? 0.9,
    topK: options.topK ?? 40,
    // ... other defaults
  };
};
```

### Chat Template Configuration
```typescript
import type { ChatTemplateConfig } from './rkllm-types';

const chatConfig: ChatTemplateConfig = {
  systemPrompt: 'You are a helpful AI assistant.',
  promptPrefix: 'Human: ',
  promptPostfix: '\n\nAssistant: ',
};
```

### Function Tools Setup
```typescript
import type { FunctionToolsConfig } from './rkllm-types';

const toolsConfig: FunctionToolsConfig = {
  systemPrompt: 'You have access to the following functions:',
  tools: JSON.stringify({
    functions: [
      {
        name: 'get_weather',
        description: 'Get current weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'City name' }
          },
          required: ['location']
        }
      }
    ]
  }),
  toolResponseStr: '<tool_response>',
};
```

## Type Safety Features

### Strict Type Checking
All interfaces use strict TypeScript typing with:
- Required vs optional properties clearly defined
- Proper numeric types (number, Int32Array, Float32Array)
- String literal types for specific values
- Union types for variant data structures

### Runtime Type Guards
```typescript
// Example type guard for input validation
function isValidRKLLMInput(input: any): input is RKLLMInput {
  return (
    typeof input === 'object' &&
    input !== null &&
    typeof input.inputType === 'number' &&
    Object.values(RKLLMInputType).includes(input.inputType)
  );
}
```

## Performance Considerations

### Memory Management
- Uses typed arrays (Float32Array, Int32Array) for efficient memory usage
- Interfaces designed to minimize object creation overhead
- Optional properties reduce memory footprint when features not used

### Data Structure Efficiency
- Flat interface structures for optimal serialization
- Minimal nesting to reduce access overhead
- Proper separation of configuration vs runtime data

## Dependencies

- **TypeScript >= 5.0**: For advanced type features
- **Node.js >= 16**: For typed array support
- **No runtime dependencies**: Pure type definitions

## Testing

The module includes comprehensive unit tests covering:

- **Enum value correctness**: Ensures enum values match C API constants
- **Interface structure validation**: Verifies all required/optional properties
- **Type compatibility**: Tests assignment and usage patterns
- **Error class functionality**: Validates custom error behavior
- **Callback type signatures**: Ensures proper function signatures
- **Memory layout compatibility**: Validates typed array usage

```bash
# Run type tests
npm test src/rkllm-types/rkllm-types.test.ts
```

## Design Principles

### C API Compatibility
- Direct mapping from C structures to TypeScript interfaces
- Maintains same naming conventions (with camelCase conversion)
- Preserves all functionality and parameters
- Compatible memory layouts for native binding

### TypeScript Best Practices
- Uses strict typing with no `any` types
- Proper interface inheritance and composition
- Optional vs required properties clearly marked
- Comprehensive JSDoc documentation

### Future Extensibility
- Modular interface design for easy extension
- Backward-compatible type evolution
- Clear separation of concerns
- Version-agnostic type definitions