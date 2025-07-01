# inference

## Purpose
Model inference execution and NPU interface management

## Overview
Provides C++ implementation with 2 source files and 1 header files. Model execution on NPU hardware, batch processing, and inference pipeline management.

## Architecture
Module architecture information will be added here.

## Source Files
## Source File: inference-engine.cpp

### Functions
- `InferenceEngine::()`
- `RKLLMManager()`
- `bool()`
- `calculateTokensPerSecond()`
- `enableKVCache()`
- `executeInference()`
- `generate()`
- `generateStream()`
- `generateStreamAsync()`
- `getModelHandle()`
- `getState()`
- `getStats()`
- `isRunning()`
- `isValid()`
- `pause()`
- `resetStats()`
- `resume()`
- `setDefaultParams()`
- `setMaxConcurrentInferences()`
- `setModelHandle()`

### Classes
*No classes found*

### Dependencies
- `../config/build-config.hpp`
- `../utils/type-converters.hpp`
- `algorithm`
- `chrono`
- `inference-engine.hpp`
- `map`
- `numeric`
- `random`
- `regex`
- `sstream`
- `thread`

## Source File: inference-engine.hpp

### Functions
- `string()`

### Classes
- `GreedySampling`
- `InferenceEngine`
- `SamplingStrategy`
- `TopKSampling`
- `TopPSampling`

### Dependencies
- `../config/build-config.hpp`
- `../core/rkllm-manager.hpp`
- `../utils/error-handler.hpp`
- `../utils/type-converters.hpp`
- `atomic`
- `functional`
- `future`
- `map`
- `memory`
- `string`
- `vector`

## Source File: inference-engine.test.cpp

### Functions
- `RKLLMJS_TEST_MAIN()`
- `TEST()`

### Classes
*No classes found*

### Dependencies
- `../config/build-config.hpp`
- `../testing/rkllmjs-test.hpp`
- `inference-engine.hpp`


## API Reference

### Functions
See source files below for detailed function information.

### Classes
See source files below for detailed class information.

### Data Structures
Data structures will be documented here.

### Enumerations
Enumerations will be documented here.

## Dependencies
See source files below for dependencies.

## Usage Examples
Usage examples will be added here.

## Error Handling
Error handling information will be added here.

## Performance Notes
Performance considerations will be documented here.

## Thread Safety
Thread safety information will be added here.

## Memory Management
Memory management details will be documented here.

## Testing
Testing information will be added here.

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
Troubleshooting guide will be added here.

---
*Generated automatically by RKLLMJS README Generator*
