# napi-bindings

## Purpose
N-API bindings for Node.js integration with C++ modules

## Overview
Provides C++ implementation with 2 source files and 1 header files. Bridge between Node.js and C++ modules enabling JavaScript access to NPU functionality.

## Architecture
Module architecture information will be added here.

## Source Files
## Source File: rkllm-napi.cpp

### Functions
- `JSRKLLMManager::()`
- `cleanup()`
- `getMemoryUsage()`
- `isInitialized()`
- `isNPUAvailable()`
- `make_unique()`
- `napi_status()`
- `string()`
- `void()`

### Classes
- `JSRKLLMManager`

### Dependencies
- `../core/rkllm-manager.hpp`
- `../inference/inference-engine.hpp`
- `iostream`
- `rkllm-napi.hpp`

## Source File: rkllm-napi.hpp

### Functions
- `void()`

### Classes
- `JSRKLLMManager`

### Dependencies
- `../config/build-config.hpp`
- `memory`
- `string`

## Source File: rkllm-napi.test.cpp

### Functions
- `int()`

### Classes
*No classes found*

### Dependencies
- `iostream`
- `rkllm-napi.hpp`


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
