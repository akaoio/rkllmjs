# adapters

## Purpose
Platform-specific runtime adapters for RKLLM integration

## Overview
Implements platform abstraction layer with adapters for different JavaScript runtimes (Node.js, Deno, Bun). Provides unified interface for cross-platform RKLLM deployment and runtime-specific optimizations.

## Architecture
- **adapter-manager.hpp**: IAdapter, TextAdapter, JsonAdapter, RKLLMAdapter, AdapterFactory, AdapterManager, AdapterPipeline


## Source Files
- `adapter-manager.cpp` (cpp)
- `adapter-manager.hpp` (hpp)


## API Reference

### Functions
#### adapter-manager.cpp

##### `cleanup()`
*No documentation available*

##### `whitespace_regex()`
*No documentation available*

##### `dangerous_regex()`
*No documentation available*

##### `preparePrompt()`
*No documentation available*

##### `processResponse()`
*No documentation available*

##### `cleanup_regex()`
*No documentation available*

##### `registerAdapter()`
*No documentation available*

##### `createAdapter()`
*No documentation available*

##### `loadAdapterInternal()`
*No documentation available*

##### `clearPipeline()`
*No documentation available*

#### adapter-manager.hpp

##### `TextAdapter()`
*No documentation available*

##### `getName()`
*No documentation available*

##### `getVersion()`
*No documentation available*

##### `getSupportedFormat()`
*No documentation available*

##### `initialize()`
*No documentation available*

##### `cleanup()`
*No documentation available*

##### `isInitialized()`
*No documentation available*

##### `convertInput()`
*No documentation available*

##### `convertOutput()`
*No documentation available*

##### `validate()`
*No documentation available*

##### `setEncoding()`
*No documentation available*

##### `getEncoding()`
*No documentation available*

##### `normalize()`
*No documentation available*

##### `sanitize()`
*No documentation available*

##### `JsonAdapter()`
*No documentation available*

##### `setPrettyPrint()`
*No documentation available*

##### `getPrettyPrint()`
*No documentation available*

##### `parseJson()`
*No documentation available*

##### `createJson()`
*No documentation available*

##### `RKLLMAdapter()`
*No documentation available*

##### `preparePrompt()`
*No documentation available*

##### `processResponse()`
*No documentation available*

##### `optimizeInput()`
*No documentation available*

##### `AdapterFactory()`
*No documentation available*

##### `isAdapterAvailable()`
*No documentation available*

##### `getAdapterInfo()`
*No documentation available*

##### `getErrorMessage()`
*No documentation available*

##### `formatToString()`
*No documentation available*

##### `stringToFormat()`
*No documentation available*

##### `AdapterManager()`
*No documentation available*

##### `loadAdapterInternal()`
*No documentation available*

##### `loadAdapter()`
*No documentation available*

##### `unloadAdapter()`
*No documentation available*

##### `loadDefaultAdapters()`
*No documentation available*

##### `convertData()`
*No documentation available*

##### `validateData()`
*No documentation available*

##### `chainAdapters()`
*No documentation available*

##### `AdapterPipeline()`
*No documentation available*

##### `addAdapter()`
*No documentation available*

##### `removeAdapter()`
*No documentation available*

##### `clearPipeline()`
*No documentation available*

##### `execute()`
*No documentation available*

##### `getAdapterCount()`
*No documentation available*



### Classes
#### adapter-manager.hpp

##### `IAdapter`
*No documentation available*

##### `TextAdapter`
*No documentation available*

##### `JsonAdapter`
*No documentation available*

##### `RKLLMAdapter`
*No documentation available*

##### `AdapterFactory`
*No documentation available*

##### `AdapterManager`
*No documentation available*

##### `AdapterPipeline`
*No documentation available*



### Data Structures
*None*

### Enumerations
- AdapterResult DataFormat 


## Dependencies
- ../config/build-config.hpp
- ../core/rkllm-manager.hpp
- ../inference/inference-engine.hpp
- adapter-manager.hpp
- algorithm
- functional
- iostream
- memory
- mutex
- ostream
- regex
- sstream
- string
- unordered_map
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