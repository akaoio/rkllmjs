# napi-bindings

## Purpose
Node.js N-API binding layer for RKLLM functionality exposure

## Overview
Provides stable and efficient Node.js bindings using N-API for RKLLM operations. Handles JavaScript to C++ bridging, async operations, memory safety, and error propagation between runtime environments.

## Architecture
- **rkllm-napi.cpp**: JSRKLLMManager
- **rkllm-napi.hpp**: JSRKLLMManager


## Source Files
- `rkllm-napi.cpp` (cpp)
- `rkllm-napi.hpp` (hpp)


## API Reference

### Functions
#### rkllm-napi.cpp

##### `engine()`
*No documentation available*

##### `test_napi_bindings()`
*No documentation available*

##### `InitRKLLMBindings()`
*No documentation available*

##### `napi_get_undefined()`
*No documentation available*

#### rkllm-napi.hpp

##### `InitRKLLMBindings()`
*No documentation available*

##### `JSRKLLMManager()`
*No documentation available*

##### `initializeModel()`
*No documentation available*

##### `generateText()`
*No documentation available*

##### `cleanup()`
*No documentation available*

##### `isInitialized()`
*No documentation available*

##### `setParameter()`
*No documentation available*

##### `getParameter()`
*No documentation available*

##### `getMemoryUsage()`
*No documentation available*

##### `isNPUAvailable()`
*No documentation available*

##### `test_napi_bindings()`
*No documentation available*



### Classes
#### rkllm-napi.cpp

##### `JSRKLLMManager`
*No documentation available*

#### rkllm-napi.hpp

##### `JSRKLLMManager`
*No documentation available*



### Data Structures
*None*

### Enumerations
*None*

## Dependencies
- ../config/build-config.hpp
- ../core/rkllm-manager.hpp
- ../inference/inference-engine.hpp
- iostream
- memory
- node_api.h
- rkllm-napi.hpp
- string


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