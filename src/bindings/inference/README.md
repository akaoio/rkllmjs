# inference

## Purpose
High-performance text generation and streaming inference engine

## Overview
Implements advanced inference capabilities with multiple sampling strategies, streaming text generation, batch processing, and KV-cache optimization. Supports concurrent inference management and real-time performance monitoring.

## Architecture
- **inference-engine.hpp**: InferenceEngine, SamplingStrategy, GreedySampling, TopKSampling, TopPSampling


## Source Files
- `inference-engine.cpp` (cpp)
- `inference-engine.hpp` (hpp)


## API Reference

### Functions
#### inference-engine.cpp

##### `stop()`
*No documentation available*

##### `validateParams()`
*No documentation available*

##### `updateStats()`
*No documentation available*

##### `callback()`
*No documentation available*

##### `whitespaceRegex()`
*No documentation available*

##### `iss()`
*No documentation available*

##### `detokenize()`
*No documentation available*

##### `formatPrompt()`
*No documentation available*

##### `escapeSpecialTokens()`
*No documentation available*

##### `calculatePerplexity()`
*No documentation available*

##### `isValidPrompt()`
*No documentation available*

##### `isValidInferenceParams()`
*No documentation available*

#### inference-engine.hpp

##### `isValid()`
*No documentation available*

##### `validate()`
*No documentation available*

##### `InferenceEngine()`
*No documentation available*

##### `generate()`
*No documentation available*

##### `setModelHandle()`
*No documentation available*

##### `getModelHandle()`
*No documentation available*

##### `generateStream()`
*No documentation available*

##### `pause()`
*No documentation available*

##### `resume()`
*No documentation available*

##### `stop()`
*No documentation available*

##### `isRunning()`
*No documentation available*

##### `getState()`
*No documentation available*

##### `setMaxConcurrentInferences()`
*No documentation available*

##### `setStreamBufferSize()`
*No documentation available*

##### `enableKVCache()`
*No documentation available*

##### `setDefaultParams()`
*No documentation available*

##### `getStats()`
*No documentation available*

##### `resetStats()`
*No documentation available*

##### `executeInference()`
*No documentation available*

##### `validateParams()`
*No documentation available*

##### `updateStats()`
*No documentation available*

##### `streamingWorker()`
*No documentation available*

##### `processBatchRequests()`
*No documentation available*

##### `preprocessPrompt()`
*No documentation available*

##### `shouldStop()`
*No documentation available*

##### `calculateTokensPerSecond()`
*No documentation available*

##### `sample()`
*No documentation available*

##### `getName()`
*No documentation available*

##### `detokenize()`
*No documentation available*

##### `formatPrompt()`
*No documentation available*

##### `escapeSpecialTokens()`
*No documentation available*

##### `calculatePerplexity()`
*No documentation available*

##### `isValidPrompt()`
*No documentation available*

##### `isValidInferenceParams()`
*No documentation available*



### Classes
#### inference-engine.hpp

##### `InferenceEngine`
*No documentation available*

##### `SamplingStrategy`
*No documentation available*

##### `GreedySampling`
*No documentation available*

##### `TopKSampling`
*No documentation available*

##### `TopPSampling`
*No documentation available*



### Data Structures
- InferenceParams InferenceResult BatchRequest BatchResult Stats 


### Enumerations
- InferenceState 


## Dependencies
- ../../../libs/rkllm/include/rkllm.h
- ../config/build-config.hpp
- ../core/rkllm-manager.hpp
- ../utils/error-handler.hpp
- ../utils/type-converters.hpp
- algorithm
- atomic
- chrono
- functional
- future
- inference-engine.hpp
- map
- memory
- numeric
- random
- regex
- sstream
- string
- thread
- vector


## Usage Examples
*Usage examples will be added based on function analysis*

## Error Handling
*Error handling documentation will be generated from code analysis*

## Performance Notes
*Performance considerations will be documented*

## Thread Safety
*Thread safety analysis will be provided*

## Memory Management
*Memory management details will be documented*

## Testing
All components have corresponding unit tests.

### Running Tests
```bash
# Build and run tests
make test

# Run with verbose output
make test-verbose

# Build debug version for testing
make debug
```

## Build Configuration

### Standalone Build
```bash
# Build the module
make

# Clean artifacts
make clean

# Install library for other modules
make install
```

## Troubleshooting
*Common issues and solutions will be documented*

---
*Generated automatically by RKLLMJS README Generator*