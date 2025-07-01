# core

## Purpose
Core RKLLM runtime management and model lifecycle operations

## Overview
Provides thread-safe singleton that manages RKLLM model instances, resource allocation, configuration validation, and cleanup operations. This module handles the fundamental infrastructure needed for RKLLM model management including NPU resource allocation and monitoring.

## Architecture
- **rkllm-manager.hpp**: RKLLMManager


## Source Files
- `rkllm-manager.cpp` (cpp)
- `rkllm-manager.hpp` (hpp)


## API Reference

### Functions
#### rkllm-manager.cpp

##### `cleanup()`
*No documentation available*

##### `updateResourceStats()`
*No documentation available*

##### `rkllm_destroy()`
*No documentation available*

##### `getDefaultConfig()`
*No documentation available*

#### rkllm-manager.hpp

##### `isValid()`
*No documentation available*

##### `getValidationError()`
*No documentation available*

##### `initialize()`
*No documentation available*

##### `cleanup()`
*No documentation available*

##### `isInitialized()`
*No documentation available*

##### `createModel()`
*No documentation available*

##### `destroyModel()`
*No documentation available*

##### `getModelConfig()`
*No documentation available*

##### `getResourceStats()`
*No documentation available*

##### `hasAvailableResources()`
*No documentation available*

##### `validateConfig()`
*No documentation available*

##### `createDefaultConfig()`
*No documentation available*

##### `getDefaultConfig()`
*No documentation available*

##### `getOptimizedConfig()`
*No documentation available*

##### `getActiveModelCount()`
*No documentation available*

##### `getErrorMessage()`
*No documentation available*

##### `generateModelId()`
*No documentation available*

##### `allocateResources()`
*No documentation available*

##### `deallocateResources()`
*No documentation available*

##### `updateResourceStats()`
*No documentation available*



### Classes
#### rkllm-manager.hpp

##### `RKLLMManager`
*No documentation available*



### Data Structures
- sysinfo 
- RKLLMModelConfig ResourceStats ModelInstance 


### Enumerations
- ManagerResult 


## Dependencies
- ../../../libs/rkllm/include/rkllm.h
- ../config/build-config.hpp
- chrono
- cstring
- fstream
- iostream
- memory
- mutex
- rkllm-manager.hpp
- sstream
- string
- sys/sysinfo.h
- thread
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