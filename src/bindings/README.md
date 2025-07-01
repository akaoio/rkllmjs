# bindings

## Purpose
Module for bindings functionality

## Overview
Provides C++ implementation with 4 source files and 1 header files. Core functionality and implementation details for the bindings component.

## Architecture
Module architecture information will be added here.

## Source Files
## Source File: binding-entry.cpp

### Functions
- `NODE_API_MODULE()`
- `Object()`

### Classes
*No classes found*

### Dependencies
- `napi.h`

## Source File: binding-entry.test.cpp

### Functions
- `int()`

### Classes
*No classes found*

### Dependencies
- `cassert`
- `iostream`
- `string`

## Source File: binding.cpp

### Functions
- `NAPI_MODULE()`
- `int()`
- `napi_value()`

### Classes
*No classes found*

### Dependencies
- `config/config-manager.hpp`
- `core/rkllm-manager.hpp`
- `inference/inference-engine.hpp`
- `iostream`
- `napi-bindings/rkllm-napi.hpp`
- `node_api.h`

## Source File: binding.test.cpp

### Functions
- `bool()`
- `int()`

### Classes
- `TestRunner`

### Dependencies
- `cassert`
- `iostream`
- `node_api.h`
- `string`

## Source File: bindings.hpp

### Functions
*No public functions found*

### Classes
*No classes found*

### Dependencies
- `adapters/adapter-manager.hpp`
- `config/config-manager.hpp`
- `core/rkllm-manager.hpp`
- `inference/inference-engine.hpp`
- `memory/memory-manager.hpp`
- `napi-bindings/rkllm-napi.hpp`
- `utils/error-handler.hpp`
- `utils/type-converters.hpp`


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
